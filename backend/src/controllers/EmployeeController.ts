import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Employee, EmployeeRole } from "../entities/Employee";
import { HermesService } from "../services/HermesService";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

export class EmployeeController {
  public static async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const empRepo = AppDataSource.getRepository(Employee);
      const employees = await empRepo.find({
        order: { created_at: "ASC" },
      });
      res.json({ success: true, data: employees });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { name, role, system_prompt, allowed_tools, avatar_url } = req.body;
      if (!name || !role || !system_prompt) {
        res.status(400).json({ success: false, message: "Nama, role, dan system prompt wajib diisi" });
        return;
      }

      const empRepo = AppDataSource.getRepository(Employee);
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(100 + Math.random() * 900);

      const employee = empRepo.create({
        id: uuidv4(),
        name,
        role: role as EmployeeRole,
        profile_name: slug,
        avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
        system_prompt,
        allowed_tools: allowed_tools || ["read_file", "write_file", "terminal"],
        status: "IDLE",
        is_active: true,
      });

      await empRepo.save(employee);

      // Create Hermes profile directory & config.yaml
      HermesService.ensureProfile(employee.profile_name, employee.system_prompt, employee.allowed_tools);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("employee:created", employee);
      }

      res.status(201).json({ success: true, data: employee });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const empRepo = AppDataSource.getRepository(Employee);
      const employee = await empRepo.findOne({ where: { id: req.params.id } });
      if (!employee) {
        res.status(404).json({ success: false, message: "Karyawan tidak ditemukan" });
        return;
      }

      const { name, role, system_prompt, allowed_tools, status, is_active } = req.body;
      if (name) employee.name = name;
      if (role) employee.role = role;
      if (system_prompt) employee.system_prompt = system_prompt;
      if (allowed_tools) employee.allowed_tools = allowed_tools;
      if (status) employee.status = status;
      if (typeof is_active === "boolean") employee.is_active = is_active;

      await empRepo.save(employee);

      const io: Server = req.app.get("io");
      if (io) {
        io.emit("employee:updated", employee);
      }

      res.json({ success: true, data: employee });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
