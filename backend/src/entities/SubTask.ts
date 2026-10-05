import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Task } from "./Task";
import { Employee } from "./Employee";

export type SubTaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "FAILED";

@Entity("sub_tasks")
export class SubTask {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 36 })
  task_id!: string;

  @ManyToOne(() => Task, (task) => task.sub_tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ type: "varchar", length: 36 })
  assigned_employee_id!: string;

  @ManyToOne(() => Employee, (emp) => emp.sub_tasks)
  @JoinColumn({ name: "assigned_employee_id" })
  assigned_employee!: Employee;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 20, default: "TODO" })
  status!: SubTaskStatus;

  @Column({ type: "int", default: 0 })
  order_index!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
