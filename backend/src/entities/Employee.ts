import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Task } from "./Task";
import { SubTask } from "./SubTask";
import { TaskLog } from "./TaskLog";

export type EmployeeRole = "PM" | "FRONTEND" | "BACKEND" | "QA" | "DEVOPS" | "RESEARCHER" | "PLANNER" | "CODE_REVIEWER" | "CUSTOM";
export type EmployeeStatus = "IDLE" | "MEETING" | "WORKING" | "BLOCKED";

@Entity("employees")
export class Employee {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 50, default: "CUSTOM" })
  role!: EmployeeRole;

  @Column({ type: "varchar", length: 100, unique: true })
  profile_name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar_url!: string;

  @Column({ type: "text" })
  system_prompt!: string;

  @Column({ type: "json", nullable: true })
  allowed_tools!: string[];

  @Column({ type: "varchar", length: 20, default: "IDLE" })
  status!: EmployeeStatus;

  @Column({ type: "boolean", default: true })
  is_online!: boolean;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Task, (task) => task.assigned_pm)
  tasks!: Task[];

  @OneToMany(() => SubTask, (subTask) => subTask.assigned_employee)
  sub_tasks!: SubTask[];

  @OneToMany(() => TaskLog, (log) => log.employee)
  logs!: TaskLog[];
}
