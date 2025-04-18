import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { ServicesService } from '../services/services.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardNavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('newUsersChart') private newUsersChartRef!: ElementRef;
  @ViewChild('totalUsersChart') private totalUsersChartRef!: ElementRef;
  @ViewChild('percentageChart') private percentageChartRef!: ElementRef;
  @ViewChild('segmentsChart') private segmentsChartRef!: ElementRef;
  
  service = inject(ServicesService);
  timeFrame: 'monthly' | 'yearly' = 'monthly';
  
  totalCustomers = '5,360';
  latestNewUsers = '650';
  growthRate = '12.1';
  
  // Chart instances
  private newUsersChart?: Chart;
  private totalUsersChart?: Chart;
  private percentageChart?: Chart;
  private segmentsChart?: Chart;
  
  // Data
  private monthlyData = [
    { name: 'Jan', newUsers: 120, total: 1200 },
    { name: 'Feb', newUsers: 150, total: 1350 },
    { name: 'Mar', newUsers: 190, total: 1540 },
    { name: 'Apr', newUsers: 210, total: 1750 },
    { name: 'May', newUsers: 280, total: 2030 },
    { name: 'Jun', newUsers: 320, total: 2350 },
    { name: 'Jul', newUsers: 350, total: 2700 },
    { name: 'Aug', newUsers: 410, total: 3110 },
    { name: 'Sep', newUsers: 490, total: 3600 },
    { name: 'Oct', newUsers: 530, total: 4130 },
    { name: 'Nov', newUsers: 580, total: 4710 },
    { name: 'Dec', newUsers: 650, total: 5360 }
  ];

  private yearlyData = [
    { name: '2020', newUsers: 1200, total: 1200 },
    { name: '2021', newUsers: 1800, total: 3000 },
    { name: '2022', newUsers: 2400, total: 5400 },
    { name: '2023', newUsers: 3600, total: 9000 },
    { name: '2024', newUsers: 5300, total: 14300 }
  ];
  
  private customerSegments = [
    { name: 'Premium', value: 2140 },
    { name: 'Standard', value: 1890 },
    { name: 'Basic', value: 1330 }
  ];

  constructor() { }

  ngOnInit() {
    // Fetch data from service if needed
    // this.fetchData();
  }
  
  ngAfterViewInit() {
    this.initializeCharts();
  }
  
  setTimeFrame(timeFrame: 'monthly' | 'yearly') {
    this.timeFrame = timeFrame;
    
    // Update summary stats
    if (timeFrame === 'monthly') {
      this.totalCustomers = '5,360';
      this.latestNewUsers = '650';
      this.growthRate = '12.1';
    } else {
      this.totalCustomers = '14,300';
      this.latestNewUsers = '5,300';
      this.growthRate = '47.2';
    }
    
    // Update charts
    this.updateCharts();
  }
  
  private initializeCharts() {
    // New Users Bar Chart
    this.newUsersChart = new Chart(this.newUsersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.monthlyData.map(item => item.name),
        datasets: [{
          label: 'New Users',
          data: this.monthlyData.map(item => item.newUsers),
          backgroundColor: '#4F46E5',
          borderColor: '#4338CA',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    
    // Total Users Line Chart
    this.totalUsersChart = new Chart(this.totalUsersChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.monthlyData.map(item => item.name),
        datasets: [{
          label: 'Total Users',
          data: this.monthlyData.map(item => item.total),
          fill: false,
          borderColor: '#10B981',
          tension: 0.1
        }]
      },
      options: {
        responsive: true
      }
    });
    
    // Growth Percentage Chart
    const percentageData = this.calculatePercentageIncrease(this.monthlyData);
    this.percentageChart = new Chart(this.percentageChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: percentageData.slice(1).map(item => item.name),
        datasets: [{
          label: 'Growth Rate (%)',
          data: percentageData.slice(1).map(item => item.percentageIncrease),
          fill: false,
          borderColor: '#F59E0B',
          tension: 0.1
        }]
      },
      options: {
        responsive: true
      }
    });
    
    // Customer Segments Pie Chart
    this.segmentsChart = new Chart(this.segmentsChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: this.customerSegments.map(item => item.name),
        datasets: [{
          data: this.customerSegments.map(item => item.value),
          backgroundColor: ['#0088FE', '#00C49F', '#FFBB28'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true
      }
    });
  }
  
  private updateCharts() {
    const data = this.timeFrame === 'monthly' ? this.monthlyData : this.yearlyData;
    const percentageData = this.calculatePercentageIncrease(data);
    
    // Update New Users Chart
    if (this.newUsersChart) {
      this.newUsersChart.data.labels = data.map(item => item.name);
      this.newUsersChart.data.datasets[0].data = data.map(item => item.newUsers);
      this.newUsersChart.update();
    }
    
    // Update Total Users Chart
    if (this.totalUsersChart) {
      this.totalUsersChart.data.labels = data.map(item => item.name);
      this.totalUsersChart.data.datasets[0].data = data.map(item => item.total);
      this.totalUsersChart.update();
    }
    
    // Update Percentage Chart
    if (this.percentageChart) {
      this.percentageChart.data.labels = percentageData.slice(1).map(item => item.name);
      this.percentageChart.data.datasets[0].data = percentageData.slice(1).map(item => item.percentageIncrease);
      this.percentageChart.update();
    }
    
    // No need to update the segments chart as it doesn't depend on timeframe
  }
  
  private calculatePercentageIncrease(data: any[]) {
    return data.map((item, index) => {
      if (index === 0) {
        return { ...item, percentageIncrease: 0 };
      }
      const percentageIncrease = ((item.newUsers - data[index - 1].newUsers) / data[index - 1].newUsers) * 100;
      return { ...item, percentageIncrease: parseFloat(percentageIncrease.toFixed(2)) };
    });
  }
  
  private fetchData() {
    // You can implement this to fetch real data from your service
    // this.service.getUserStats().subscribe(data => {
    //   // Process and assign data
    // });
  }
}