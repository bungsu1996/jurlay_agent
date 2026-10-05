import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { GithubProject } from "../entities/GithubProject";
import { GitService } from "../services/GitService";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export class ProjectController {
  public static async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const projRepo = AppDataSource.getRepository(GithubProject);
      const projects = await projRepo.find({ order: { created_at: "DESC" } });
      res.json({ success: true, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, repo_url, local_path, default_branch = "main" } = req.body;
      if (!name || !local_path) {
        res.status(400).json({ success: false, message: "Nama project dan local path wajib diisi" });
        return;
      }

      if (!fs.existsSync(local_path)) {
        res.status(400).json({ success: false, message: `Path lokal "${local_path}" tidak ditemukan di file system` });
        return;
      }

      const projRepo = AppDataSource.getRepository(GithubProject);
      const project = projRepo.create({
        id: uuidv4(),
        name,
        repo_url,
        local_path,
        default_branch,
        last_sync_at: new Date(),
      });

      await projRepo.save(project);
      res.status(201).json({ success: true, data: project });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getProjectStatus(req: Request, res: Response): Promise<void> {
    try {
      const projRepo = AppDataSource.getRepository(GithubProject);
      const project = await projRepo.findOne({ where: { id: req.params.id } });
      if (!project) {
        res.status(404).json({ success: false, message: "Project tidak ditemukan" });
        return;
      }

      const details = await GitService.getRepoDetails(project.local_path);
      res.json({ success: true, data: { ...project, ...details } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async pullProject(req: Request, res: Response): Promise<void> {
    try {
      const projRepo = AppDataSource.getRepository(GithubProject);
      const project = await projRepo.findOne({ where: { id: req.params.id } });
      if (!project) {
        res.status(404).json({ success: false, message: "Project tidak ditemukan" });
        return;
      }

      const result = await GitService.pullLatest(project.local_path);
      project.last_sync_at = new Date();
      await projRepo.save(project);

      res.json({ success: true, message: "Git pull berhasil!", data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
