import { writeFile } from "node:fs/promises";

const USER = process.env.GH_USER || "Xviizyk";
const TOKEN = process.env.GH_TOKEN;
const ACTIVITY_HASH = process.env.ACTIVITY_HASH || "";
const API = "https://api.github.com";

if (!TOKEN) throw new Error("GH_TOKEN missing");

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...headers
    }
  });

  if (res.status === 409) return [];
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

const gh = path => fetchJSON(`${API}${path}`, {
  Authorization: `Bearer ${TOKEN}`,
  "X-GitHub-Api-Version": "2022-11-28"
});

async function getRepos() {
  const repos = [];

  for (let page = 1; ; page++) {
    const batch = await gh(`/users/${USER}/repos?per_page=100&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  return repos;
}

async function main() {
  const [profile, repos, prs, issues, commitSearch, contrib] =
    await Promise.all([
      gh(`/users/${USER}`),
      getRepos(),
      gh(`/search/issues?q=author:${USER}+type:pr&per_page=1`),
      gh(`/search/issues?q=author:${USER}+type:issue&per_page=1`),
      gh(`/search/commits?q=author:${USER}&sort=committer-date&order=desc&per_page=15`),
      fetchJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`)
        .catch(() => ({ contributions: [] }))
    ]);

  const stars = repos.reduce((n, r) => n + r.stargazers_count, 0);
  const forks = repos.reduce((n, r) => n + r.forks_count, 0);
  const watchers = repos.reduce((n, r) => n + r.watchers_count, 0);
  const size = repos.reduce((n, r) => n + r.size, 0);

  const languages = {};

  await Promise.all(repos.slice(0, 10).map(async repo => {
    try {
      const data = await gh(`/repos/${repo.full_name}/languages`);
      for (const [name, bytes] of Object.entries(data)) {
        languages[name] = (languages[name] || 0) + bytes;
      }
    } catch {}
  }));

  const projects = await Promise.all(
    [...repos]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map(async repo => ({
        repo,
        commits: await gh(`/repos/${repo.full_name}/commits?per_page=5`)
          .catch(() => null)
      }))
  );

  const seen = new Set();
  const recentCommits = [
    ...projects.flatMap(({ repo, commits }) =>
      (commits || [])
        .filter(c => c.author?.login?.toLowerCase() === USER.toLowerCase())
        .map(c => ({
          sha: c.sha,
          url: c.html_url,
          repo: repo.full_name,
          message: (c.commit?.message || "").split("\n")[0],
          date: c.commit?.committer?.date || c.commit?.author?.date || ""
        }))
    ),
    ...(commitSearch.items || []).map(c => ({
      sha: c.sha,
      url: c.html_url,
      repo: c.repository?.full_name || "unknown",
      message: (c.commit?.message || "").split("\n")[0],
      date: c.commit?.committer?.date || c.commit?.author?.date || ""
    }))
  ]
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
    .filter(c => c.url && !seen.has(c.url) && seen.add(c.url))
    .slice(0, 15);

  const data = {
    activity_hash: ACTIVITY_HASH,
    last_commit_sha: recentCommits[0]?.sha || commitSearch.items?.[0]?.sha || "",

    profile,

    totals: {
      stars,
      forks,
      repositories: repos.length
    },

    stats: {
      stars,
      forks,
      watchers,
      size,
      prs: prs.total_count,
      issues: issues.total_count,
      commits: commitSearch.total_count
    },

    repos,
    languages,
    recent_commits: recentCommits.map(({ url, repo, message }) => ({ url, repo, message })),

    contributions: (contrib.contributions || []).map(d => ({
      date: d.date,
      count: d.count,
      level: d.level
    })),

    projects,

    updated_at: new Date().toISOString()
  };

  await writeFile("data.json", JSON.stringify(data, null, 2) + "\n");

  console.log("Done: Profile data updated");
  console.log("Profile information:");
  console.log(` Stars: ${stars}`);
  console.log(` Followers: ${profile.followers}`);
  console.log(` Repositories: ${repos.length}`);
  console.log(` Commits: ${commitSearch.total_count}`);
}

main().catch(err => {
  console.error("Error: ", err);
  process.exit(1);
});