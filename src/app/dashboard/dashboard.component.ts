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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardNavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // User chart ViewChilds
  @ViewChild('newUsersChart') private newUsersChartRef!: ElementRef;
  @ViewChild('totalUsersChart') private totalUsersChartRef!: ElementRef;
  @ViewChild('percentageChart') private percentageChartRef!: ElementRef;
  @ViewChild('segmentsChart') private segmentsChartRef!: ElementRef;

  // Transaction chart ViewChilds
  @ViewChild('transactionChart') private transactionChartRef!: ElementRef;
  @ViewChild('cumulativeTransactionChart') private cumulativeTransactionChartRef!: ElementRef;

  // Chart instances (User charts)
  private newUsersChart?: Chart;
  private totalUsersChart?: Chart;
  private percentageChart?: Chart;
  private segmentsChart?: Chart;
  // Chart instances (Transaction charts)
  private transactionChart?: Chart;
  private cumulativeTransactionChart?: Chart;
  private transactionGrowthChart?: Chart;

  service = inject(ServicesService);
  timeFrame: 'monthly' | 'yearly' = 'monthly';

  totalCustomers = '';
  latestNewUsers = '';
  growthRate = '';

  // Flag to track if charts have been initialized
  private chartsInitialized = false;

  // Data arrays for user stats
  monthlyData: any[] = [];
  yearlyData: any[] = [];
  customerSegments: any[] = [];
  // Data arrays for transactions
  transactionMonthlyData: any[] = [];
  transactionYearlyData: any[] = [];

  transactionMonthlyGrowthRate: any[] = [];
  transactionYearlyGrowthRate: any[] = [];

  ngOnInit() {
    // No need to fetch data here; do it after view init to access ViewChild elements
  }

  ngAfterViewInit() {
    this.fetchDashboardStats();
  }

  fetchDashboardStats() {
    forkJoin({
      monthlyCustomers: this.service.getMonthlyCustomerRegistrations(),
      yearlyCustomers: this.service.getCustomerRegistrationsByYear(),
      growth: this.service.getCustomerGrowthRate(),
      total: this.service.getTotalCustomers(),
      joins: this.service.getMonthlyJoins(),
      monthlyTransactions: this.service.getMonthlyTransactions(),
      yearlyTransactions: this.service.getYearlyTransactions(),
      monthlyTxGrowth: this.service.getMonthlyTransactionGrowthRate(),
      yearlyTxGrowth: this.service.getYearlyTransactionGrowthRate()
    }).subscribe({
      next: (results) => {
        const {
          monthlyCustomers,
          yearlyCustomers,
          growth,
          total,
          joins,
          monthlyTransactions,
          yearlyTransactions,
          monthlyTxGrowth,
          yearlyTxGrowth
        } = results;

        // Process user data
        this.monthlyData = monthlyCustomers.map((item: any, index: number) => ({
          name: item.month,
          newUsers: item.count,
          total: index === 0 ? item.count : item.count + (this.monthlyData[index - 1]?.total || 0)
        }));
        this.yearlyData = yearlyCustomers.map((item: any, index: number) => ({
          name: item.year,
          newUsers: item.count,
          total: index === 0 ? item.count : item.count + (this.yearlyData[index - 1]?.total || 0)
        }));
        this.growthRate = this.timeFrame === 'monthly'
          ? growth.monthly.toFixed(1)
          : growth.yearly.toFixed(1);
        this.totalCustomers = total.toLocaleString();
        this.latestNewUsers = joins.toString();

        // Process transaction data
        this.transactionMonthlyData = monthlyTransactions;
        this.transactionYearlyData = yearlyTransactions;

        this.transactionMonthlyGrowthRate = monthlyTxGrowth.map((item: any) => ({
          month: item.month ?? '',
          growth: item.growth ?? 0
        }));
        
        this.transactionYearlyGrowthRate = yearlyTxGrowth.map((item: any) => ({
          year: item.year ?? '', 
          growth: item.growth ?? 0
        }));
        
        

        console.log('Monthly Data:', monthlyTxGrowth);
        console.log('Yearly Data:', yearlyTxGrowth);
        console.log('Monthly Transactions **** :', this.transactionYearlyGrowthRate);


        // Initialize charts after a short delay to ensure ViewChilds are available
        setTimeout(() => {
          if (!this.chartsInitialized) {
            this.initializeCharts();
            this.chartsInitialized = true;
          } else {
            const txData = this.timeFrame === 'monthly'
              ? this.transactionMonthlyData
              : this.transactionYearlyData;
            this.updateTransactionCharts(txData);
            this.updateUserCharts();
          }
        }, 0);

      },
      error: (error) => {
        console.error('Error fetching dashboard stats:', error);
        this.totalCustomers = '0';
        this.latestNewUsers = '0';
        this.growthRate = '0';
      }
    });
  }

  private initializeCharts() {
    // Get user and transaction data based on timeframe
    const txData = this.timeFrame === 'monthly' ? this.transactionMonthlyData : this.transactionYearlyData;
    const userData = this.timeFrame === 'monthly' ? this.monthlyData : this.yearlyData;

    const percentageData = this.timeFrame === 'monthly'
      ? this.transactionMonthlyGrowthRate
      : this.transactionYearlyGrowthRate;

    

    if (!txData || txData.length === 0) {
      console.warn('No transaction data available to initialize transaction charts');
      // Optionally, you can still initialize user charts.
    }

    // Destroy existing charts if they exist
    this.newUsersChart?.destroy();
    this.totalUsersChart?.destroy();
    this.percentageChart?.destroy();
    this.segmentsChart?.destroy();
    this.transactionChart?.destroy();
    //this.cumulativeTransactionChart?.destroy();
    this.transactionGrowthChart?.destroy();

    // Initialize User Charts
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

    // Initialize Transaction Charts
    this.transactionChart = new Chart(this.transactionChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: txData.map(item => item.month || item.year),
        datasets: [{
          label: 'Total Transactions (MAD)',
          data: txData.map(item => item.amount),
          backgroundColor: '#48cae4',
          borderRadius: 8
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });    

    this.transactionGrowthChart = new Chart(this.percentageChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: percentageData.map(item => item.month || item.year),
        datasets: [{
          label: 'Transaction Growth (%)',
          data: percentageData.map(item => item.growth),
          fill: false,
          borderColor: '#00b4d8',
          tension: 0.4
        }]
      },
      options: { responsive: true }
    });

  }

  private updateTransactionCharts(data: any[]) {
    if (!data || data.length === 0) {
      console.warn('No transaction data available for updating charts');
      return;
    }

    // Update Transaction Bar Chart
    if (this.transactionChart) {
      this.transactionChart.data.labels = data.map(item => item.month || item.year);
      this.transactionChart.data.datasets[0].data = data.map(item => item.amount);
      this.transactionChart.update();
    }

    // Update Cumulative Transaction Chart
    if (this.cumulativeTransactionChart) {
      this.cumulativeTransactionChart.data.labels = data.map(item => item.month || item.year);
      this.cumulativeTransactionChart.data.datasets[0].data = data.reduce((acc: number[], curr: any, idx: number) => {
        const amt = typeof curr.amount === 'number' ? curr.amount : parseFloat(curr.amount);
        const prev = acc[idx - 1] || 0;
        acc.push(prev + amt);
        return acc;
      }, []);
      this.cumulativeTransactionChart.update();
    }

    // Update Transaction Growth Chart
    if (this.transactionGrowthChart) {
      const growthData = this.timeFrame === 'monthly'
        ? this.transactionMonthlyGrowthRate
        : this.transactionYearlyGrowthRate;
        
      if (growthData && growthData.length > 0) {
        this.transactionGrowthChart.data.labels = growthData.map(item => item.month || item.year);
        this.transactionGrowthChart.data.datasets[0].data = growthData.map(item => item.growth);
        this.transactionGrowthChart.update();
      } else {
        console.warn(`No growth data available for ${this.timeFrame} view`);
      }
    }
  }

  private calculateTransactionGrowth(data: any[]) {
    return data.map((item, index) => {
      if (index === 0) return { ...item, percentageIncrease: 0 };
      const prev = data[index - 1];
      const currentAmt = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
      const prevAmt = typeof prev.amount === 'number' ? prev.amount : parseFloat(prev.amount);
      const increase = prevAmt === 0 ? 0 : ((currentAmt - prevAmt) / prevAmt) * 100;
      return { ...item, percentageIncrease: parseFloat(increase.toFixed(2)) };
    });
  }

  private updateUserCharts() {
    const data = this.timeFrame === 'monthly' ? this.monthlyData : this.yearlyData;
    if (this.newUsersChart) {
      this.newUsersChart.data.labels = data.map(item => item.name);
      this.newUsersChart.data.datasets[0].data = data.map(item => item.newUsers);
      this.newUsersChart.update();
    }
    if (this.totalUsersChart) {
      this.totalUsersChart.data.labels = data.map(item => item.name);
      this.totalUsersChart.data.datasets[0].data = data.map(item => item.total);
      this.totalUsersChart.update();
    }
  }

  setTimeFrame(timeFrame: 'monthly' | 'yearly') {
    this.timeFrame = timeFrame;
    const txData = timeFrame === 'monthly' ? this.transactionMonthlyData : this.transactionYearlyData;
    if (txData && txData.length > 0) {
      this.updateTransactionCharts(txData);
    } else {
      console.warn(`No ${timeFrame} transaction data available`);
    }
    this.updateUserCharts();
    this.service.getCustomerGrowthRate().subscribe((growth) => {
      this.growthRate = this.timeFrame === 'monthly'
        ? growth.monthly.toFixed(1)
        : growth.yearly.toFixed(1);
    });
  }
}
