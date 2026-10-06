import simpleGit, { SimpleGit } from "simple-git";
import fs from "fs";
import path from "path";

export class GitService {
  public static async getRepoDetails(localPath: string) {
    let effectivePath = localPath;
    if (!effectivePath || !fs.existsSync(effectivePath)) {
      const rootPath = path.resolve(__dirname, "../../..");
      if (fs.existsSync(rootPath)) {
        effectivePath = rootPath;
      } else if (fs.existsSync(process.cwd())) {
        effectivePath = process.cwd();
      } else {
        return {
          isRepo: false,
          currentBranch: "-",
          commits: [],
          status: null,
          error: `Directory tidak ditemukan: ${localPath}`,
        };
      }
    }

    const git: SimpleGit = simpleGit(effectivePath);
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
