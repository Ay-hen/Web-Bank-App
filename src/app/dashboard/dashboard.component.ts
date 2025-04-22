import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  inject
} from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('newUsersChart') private newUsersChartRef!: ElementRef;
  @ViewChild('totalUsersChart') private totalUsersChartRef!: ElementRef;
  @ViewChild('percentageChart') private percentageChartRef!: ElementRef;
  @ViewChild('segmentsChart') private segmentsChartRef!: ElementRef;

  @ViewChild('transactionChart') private transactionChartRef!: ElementRef;
  @ViewChild('cumulativeTransactionChart') private cumulativeTransactionChartRef!: ElementRef;  

  private transactionChart?: Chart;
private cumulativeTransactionChart?: Chart;

  service = inject(ServicesService);
  timeFrame: 'monthly' | 'yearly' = 'monthly';

  totalCustomers = '';
  latestNewUsers = '';
  growthRate = '';

  private newUsersChart?: Chart;
  private totalUsersChart?: Chart;
  private percentageChart?: Chart;
  private segmentsChart?: Chart;

  monthlyData: any[] = [];
  yearlyData: any[] = [];
  customerSegments: any[] = [];
  transactionMonthlyData: any[] = [];
  transactionYearlyData: any[] = [];
  
  // Flag to track if charts have been initialized
  private chartsInitialized = false;

  ngOnInit() {
    this.fetchDashboardStats();
  }

  ngAfterViewInit() {
    // We will initialize charts after data is available
  }

  fetchDashboardStats() {
    this.service.getMonthlyCustomerRegistrations().subscribe((monthlyData) => {
      console.log("---------------------> "+monthlyData);
      this.monthlyData = monthlyData.map((item: any, index: number) => ({
        name: item.month,
        newUsers: item.count,
        total: index === 0 ? item.count : item.count + this.monthlyData[index - 1]?.total || 0
      }));
      // We don't call updateCharts() here anymore
      
    });

    this.service.getCustomerRegistrationsByYear().subscribe((yearlyData) => {
      this.yearlyData = yearlyData.map((item: any, index: number) => ({
        name: item.year,
        newUsers: item.count,
        total: index === 0 ? item.count : item.count + this.yearlyData[index - 1]?.total || 0
      }));
    });

    this.service.getCustomerGrowthRate().subscribe((growth) => {
      this.growthRate = this.timeFrame === 'monthly'
        ? growth.monthly.toFixed(1)
        : growth.yearly.toFixed(1);
    });

    this.service.getTotalCustomers().subscribe((total) => {
      this.totalCustomers = total.toLocaleString();
    });

    this.service.getMonthlyJoins().subscribe((joins) => {
      this.latestNewUsers = joins.toString();
    });

    

    // Get transaction data and initialize charts after data is available
    this.service.getMonthlyTransactions().subscribe(data => {
      this.transactionMonthlyData = data;
      console.log("Monthly transactions loaded:", this.transactionMonthlyData);
      
      if (this.timeFrame === 'monthly' && !this.chartsInitialized) {
        this.initializeCharts();
        this.chartsInitialized = true;
      } else if (this.timeFrame === 'monthly' && this.chartsInitialized) {
        this.updateTransactionCharts(this.transactionMonthlyData);
      }
    });
    
    this.service.getYearlyTransactions().subscribe(data => {
      this.transactionYearlyData = data;
      console.log("Yearly transactions loaded:", this.transactionYearlyData);
      
      if (this.timeFrame === 'yearly' && !this.chartsInitialized) {
        this.initializeCharts();
        this.chartsInitialized = true;
      } else if (this.timeFrame === 'yearly' && this.chartsInitialized) {
        this.updateTransactionCharts(this.transactionYearlyData);
      }
    });
  }

  private updateTransactionCharts(data: any[]) {
    if (!data || data.length === 0) {
      console.warn('No data available for updating charts');
      return;
    }

    console.log('Updating charts with data:', data);

    if (this.newUsersChart) {
      this.newUsersChart.data.labels = data.map(item => item.month || item.year);
      this.newUsersChart.data.datasets[0].data = data.map(item => item.amount);
      this.newUsersChart.update();
    }
  
    if (this.totalUsersChart) {
      this.totalUsersChart.data.labels = data.map(item => item.month || item.year);
      this.totalUsersChart.data.datasets[0].data = data.reduce((acc: number[], curr: any, idx: number) => {
        const currentAmount = typeof curr.amount === 'number' ? curr.amount : parseFloat(curr.amount);
        const prevTotal = acc[idx - 1] || 0;
        acc.push(prevTotal + currentAmount);
        return acc;
      }, []);
      this.totalUsersChart.update();
    }
  
    if (this.percentageChart) {
      const percentageData = this.calculateTransactionGrowth(data);
      this.percentageChart.data.labels = percentageData.slice(1).map(d => d.month || d.year);
      this.percentageChart.data.datasets[0].data = percentageData.slice(1).map(d => d.percentageIncrease);
      this.percentageChart.update();
    }
  }
  
  private calculateTransactionGrowth(data: any[]) {
    return data.map((item, index) => {
      if (index === 0) return { ...item, percentageIncrease: 0 };
      const prev = data[index - 1];
      const currentAmount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
      const prevAmount = typeof prev.amount === 'number' ? prev.amount : parseFloat(prev.amount);
      
      const increase = prevAmount === 0 ? 0 : ((currentAmount - prevAmount) / prevAmount) * 100;
      return { ...item, percentageIncrease: parseFloat(increase.toFixed(2)) };
    });
  }

  setTimeFrame(timeFrame: 'monthly' | 'yearly') {
    this.timeFrame = timeFrame;
    const data = timeFrame === 'monthly' ? this.transactionMonthlyData : this.transactionYearlyData;
    
    // Check if data is available
    if (data && data.length > 0) {
      this.updateTransactionCharts(data);
    } else {
      console.warn(`No ${timeFrame} transaction data available`);
    }
    
    // Update growth rate when timeframe changes
    this.service.getCustomerGrowthRate().subscribe((growth) => {
      this.growthRate = this.timeFrame === 'monthly'
        ? growth.monthly.toFixed(1)
        : growth.yearly.toFixed(1);
    });
  }

  private initializeCharts() {
    const data = this.timeFrame === 'monthly' 
      ? this.transactionMonthlyData 
      : this.transactionYearlyData;

      const userData = this.timeFrame === 'monthly' ? this.monthlyData : this.yearlyData;
    
    console.log('Initializing charts with data:', data);
    console.log('Initializing charts with data user :', userData);
    
    if (!data || data.length === 0) {
      console.warn('No transaction data available to initialize charts');
      return;
    }

    // Destroy existing charts if they exist
    if (this.newUsersChart) {
      this.newUsersChart.destroy();
    }
    if (this.totalUsersChart) {
      this.totalUsersChart.destroy();
    }
    if (this.percentageChart) {
      this.percentageChart.destroy();
    }
    if (this.segmentsChart) {
      this.segmentsChart.destroy();
    }

    this.newUsersChart = new Chart(this.newUsersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: userData.map(item => item.name),
        datasets: [{
          label: 'New Users',
          data: userData.map(item => item.newUsers),
          backgroundColor: '#48cae4',
          borderRadius: 8
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    this.totalUsersChart = new Chart(this.totalUsersChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: userData.map(item => item.name),
        datasets: [{
          label: 'Total Users',
          data: userData.map(item => item.total),
          fill: false,
          borderColor: '#0077b6',
          tension: 0.4
        }]
      },
      options: { responsive: true }
    });

    this.transactionChart = new Chart(this.transactionChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(item => item.month || item.year),
        datasets: [{
          label: 'Total Transactions (MAD)',
          data: data.map(item => item.amount),
          backgroundColor: '#48cae4',
          borderRadius: 8
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
    

    // Initialize percentage growth chart
    const percentageData = this.calculateTransactionGrowth(data);
    this.percentageChart = new Chart(this.percentageChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: percentageData.slice(1).map(item => item.month || item.year),
        datasets: [{
          label: 'Transaction Growth (%)',
          data: percentageData.slice(1).map(item => item.percentageIncrease),
          fill: false,
          borderColor: '#00b4d8',
          tension: 0.4
        }]
      },
      options: { responsive: true }
    });

    // Initialize segments chart if data is available
    if (this.customerSegments.length > 0) {
      this.segmentsChart = new Chart(this.segmentsChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: this.customerSegments.map(s => s.name),
          datasets: [{
            data: this.customerSegments.map(s => s.value),
            backgroundColor: ['#003daa', '#4F79E5', '#7CAEFF'],
            hoverOffset: 4
          }]
        },
        options: { responsive: true }
      });
    }

  }

  // For backward compatibility
  private calculatePercentageIncrease(data: any[]) {
    return data.map((item, index) => {
      if (index === 0) return { ...item, percentageIncrease: 0 };
      const prev = data[index - 1];
      const increase = prev.newUsers === 0 ? 0 : ((item.newUsers - prev.newUsers) / prev.newUsers) * 100;
      return { ...item, percentageIncrease: parseFloat(increase.toFixed(2)) };
    });
  }
}