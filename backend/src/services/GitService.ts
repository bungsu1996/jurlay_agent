import simpleGit, { SimpleGit } from "simple-git";
import fs from "fs";

export class GitService {
  public static async getRepoDetails(localPath: string) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Directory tidak ditemukan: ${localPath}`);
    }

    const git: SimpleGit = simpleGit(localPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        isRepo: false,
        currentBranch: "-",
        commits: [],
        status: null,
      };
    }

    try {
      const branchSummary = await git.branch();
      const statusSummary = await git.status();
      const logSummary = await git.log({ maxCount: 10 });

      return {
        isRepo: true,
        currentBranch: branchSummary.current,
        allBranches: branchSummary.all,
        status: {
          modified: statusSummary.modified,
          not_added: statusSummary.not_added,
          ahead: statusSummary.ahead,
          behind: statusSummary.behind,
          current: statusSummary.current,
        },
        commits: logSummary.all.map((c) => ({
          hash: c.hash.substring(0, 7),
          date: c.date,
          message: c.message,
          author_name: c.author_name,
        })),
      };
    } catch (err: any) {
      return {
        isRepo: true,
        currentBranch: "unknown",
        error: err.message,
        commits: [],
        status: null,
      };
    }
  }

  public static async pullLatest(localPath: string) {
    const git: SimpleGit = simpleGit(localPath);
    return await git.pull();
  }
}
