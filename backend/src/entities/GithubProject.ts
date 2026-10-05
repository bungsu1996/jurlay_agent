import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Task } from "./Task";

@Entity("github_projects")
export class GithubProject {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  repo_url!: string;

  @Column({ type: "varchar", length: 255 })
  local_path!: string;

  @Column({ type: "varchar", length: 50, default: "main" })
  default_branch!: string;

  @Column({ type: "timestamp", nullable: true })
  last_sync_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Task, (task) => task.github_project)
  tasks!: Task[];
}
