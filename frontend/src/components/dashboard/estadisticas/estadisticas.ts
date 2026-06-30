import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios.service';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  private usuariosService = inject(UsuariosService);

  // Referencias a los canvas de los gráficos
  @ViewChild('chartPub') chartPubRef!: ElementRef;
  @ViewChild('chartCom') chartComRef!: ElementRef;
  @ViewChild('chartPubCom') chartPubComRef!: ElementRef;

  // Instancias de Chart.js — las guardamos para destruirlas al salir
  private charts: Chart[] = [];

  cargando = signal(false);

  // Fechas por defecto: primer día del mes hasta hoy
  desde = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]);
  hasta = signal(new Date().toISOString().split('T')[0]);

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.cargando.set(true);
    this.destruirGraficos(); // destruir los anteriores antes de crear nuevos

    try {
      const [pubPorUser, comPorDia, comPorPub] = await Promise.all([
        this.usuariosService.publicacionesPorUsuario(this.desde(), this.hasta()),
        this.usuariosService.comentariosPorDia(this.desde(), this.hasta()),
        this.usuariosService.comentariosPorPublicacion(this.desde(), this.hasta()),
      ]);

      // Pequeño delay para que los canvas estén en el DOM
      setTimeout(() => {
        this.crearGraficoTorta(pubPorUser);
        this.crearGraficoLineas(comPorDia);
        this.crearGraficoBarras(comPorPub);
      }, 50);

    } catch (e) {
      console.error('Error al cargar estadísticas', e);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Gráfico de torta — publicaciones por usuario ──────────────
  private crearGraficoTorta(datos: any[]) {
    const ctx = this.chartPubRef?.nativeElement?.getContext('2d');
    if (!ctx || datos.length === 0) return;

    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: datos.map(d => d.usuario),
        datasets: [{
          data: datos.map(d => d.total),
          backgroundColor: [
            'rgba(99,102,241,0.8)', 'rgba(6,182,212,0.8)',
            'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)',
            'rgba(244,63,94,0.8)', 'rgba(168,85,247,0.8)',
          ],
          borderColor: 'rgba(13,18,30,0.5)',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8' } },
          title: { display: false },
        },
      },
    });
    this.charts.push(chart);
  }

  // ── Gráfico de líneas — comentarios por día ──────────────────
  private crearGraficoLineas(datos: any[]) {
    const ctx = this.chartComRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datos.map(d => d.fecha),
        datasets: [{
          label: 'Comentarios',
          data: datos.map(d => d.total),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#06b6d4',
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        },
        plugins: { legend: { labels: { color: '#94a3b8' } } },
      },
    });
    this.charts.push(chart);
  }

  // ── Gráfico de barras — comentarios por publicación ──────────
  private crearGraficoBarras(datos: any[]) {
    const ctx = this.chartPubComRef?.nativeElement?.getContext('2d');
    if (!ctx || datos.length === 0) return;

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.titulo),
        datasets: [{
          label: 'Comentarios',
          data: datos.map(d => d.total),
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        },
        plugins: { legend: { labels: { color: '#94a3b8' } } },
      },
    });
    this.charts.push(chart);
  }

  private destruirGraficos() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  ngOnDestroy() {
    this.destruirGraficos();
  }
}