import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee";
import { GithubProject } from "./GithubProject";
import { SubTask } from "./SubTask";
import { Meeting } from "./Meeting";
import { TaskLog } from "./TaskLog";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "BACKLOG" | "MEETING" | "IN_PROGRESS" | "QA_REVIEW" | "DONE";

@Entity("tasks")
export class Task {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  task_code!: string;

  @Column({ type: "varchar", length: 200, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  title!: string;

  @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  description!: string;

  @Column({ type: "varchar", length: 20, default: "MEDIUM" })
  priority!: TaskPriority;

  @Column({ type: "varchar", length: 20, default: "BACKLOG" })
  status!: TaskStatus;

  @Column({ type: "varchar", length: 36 })
  assigned_pm_id!: string;

  @ManyToOne(() => Employee, (employee) => employee.tasks)
  @JoinColumn({ name: "assigned_pm_id" })
  assigned_pm!: Employee;

  @Column({ type: "varchar", length: 36, nullable: true })
  github_project_id!: string | null;

  @ManyToOne(() => GithubProject, (proj) => proj.tasks, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "github_project_id" })
  github_project!: GithubProject | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  project_root_path!: string | null;

  @Column({ type: "text", nullable: true, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
  assigned_employee_ids_json!: string | null;

  @Column({ type: "text", nullable: true })
  action_plan_summary!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => SubTask, (sub) => sub.task, { cascade: true })
  sub_tasks!: SubTask[];

  @OneToOne(() => Meeting, (meeting) => meeting.task, { cascade: true })
  meeting!: Meeting;

  @OneToMany(() => TaskLog, (log) => log.task, { cascade: true })
  logs!: TaskLog[];
}
