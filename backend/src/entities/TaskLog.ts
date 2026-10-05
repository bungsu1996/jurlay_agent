import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Task } from "./Task";
import { SubTask } from "./SubTask";
import { Employee } from "./Employee";

export type LogType = "INFO" | "COMMAND" | "FILE_WRITE" | "GIT_DIFF" | "ERROR" | "SUCCESS";

@Entity("task_logs")
export class TaskLog {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  task_id!: string;

  @ManyToOne(() => Task, (task) => task.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ type: "varchar", length: 36, nullable: true })
  sub_task_id!: string | null;

  @ManyToOne(() => SubTask, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "sub_task_id" })
  sub_task!: SubTask | null;

  @Column({ type: "varchar", length: 36 })
  employee_id!: string;

  @ManyToOne(() => Employee, (emp) => emp.logs)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;

  @Column({ type: "varchar", length: 30, default: "INFO" })
  log_type!: LogType;

  @Column({ type: "longtext" })
  content!: string;

  @CreateDateColumn()
  created_at!: Date;
}
