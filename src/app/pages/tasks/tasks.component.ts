import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {

    OnInit() {
        // Aquí puedes inicializar cualquier dato o lógica que necesites al cargar el componente
    }
    ngOnInit(): void {
      
    }
}
