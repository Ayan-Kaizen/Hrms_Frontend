import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

interface Asset {
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  status: string;
  serial_no: string;
  created_at: Date;
}

interface MaintenanceTicket {
  ticket_id: string;
  asset_id: string;
  model: string;
  issue_description: string;
  status: string;
  created_at: Date;
  latest_update?: {
    message: string;
    date: Date;
    is_hr: boolean;
  };
}

interface ActivityLog {
  id: number;
  employee_id?: string;
  employee_email?: string;
  employee_name?: string;
  action_type: string;
  action_description: string;
  asset_id?: string;
  ticket_id?: string;
  performed_by: string;
  performed_by_name?: string;
  created_at: Date;
  additional_data?: any;
}

interface TicketActivityGroup {
  ticket_id: string;
  activities: ActivityLog[];
}

interface ActivityLogOld {
  date: Date;
  user: string;
  message: string;
  type: string;
  attachments?: string[];
}

interface TicketFilters {
  search: string;
  status: string;
  fromDate: Date | null;
  toDate: Date | null;
}

@Component({
  selector: 'app-asset-management-emp',
  templateUrl: './asset-management-emp.component.html',
  styleUrls: ['./asset-management-emp.component.css'],
  providers: [DatePipe]
})
export class AssetManagementEmpComponent implements OnInit {
  // UI State
  activeTab = 'my-assets';
  isSidebarMinimized = false;
  isRaiseTicketModalOpen = false;
  isUpdateTicketModalOpen = false;
  isActivityLogModalOpen = false;
  isLoading = false;
  isSubmitting = false;
  isSubmittingUpdate = false;
  
  // File handling
  selectedFile: File | null = null;
  fileError: string = '';
  selectedUpdateFile: File | null = null;
  updateFileError: string = '';
  
  // Menu state
  openTicketMenuId: string | null = null;
  
  // User data
  user = { name: 'Employee', email: '' };
  
  // Data arrays
  myAssets: Asset[] = [];
  myTicketsWithUpdates: MaintenanceTicket[] = [];
  filteredTickets: MaintenanceTicket[] = [];
  
  // Modal data
  selectedTicket: any = null;
  selectedTicketForUpdate: any = null;
  selectedTicketActivities: ActivityLogOld[] = [];
  
  // Form data
  ticketRequest = {
    deviceId: '',
    description: '',
    proof: null
  };

  ticketUpdateRequest = {
    ticketId: '',
    message: '',
    proof: null
  };

  // Filter properties
  ticketFilters: TicketFilters = {
    search: '',
    status: '',
    fromDate: null,
    toDate: null
  };

  // Activity Logs Properties (Updated for grouping)
  groupedActivityLogs: TicketActivityGroup[] = [];
  isLoadingActivityLogs = false;
  expandedTicketIds = new Set<string>();
  expandedActivityIds = new Set<number>();

  // Material Table Column Definitions
  assetDisplayedColumns: string[] = ['asset_id', 'name', 'type', 'brand', 'model', 'serial_no', 'created_at', 'status'];
  ticketDisplayedColumns: string[] = ['ticket_id', 'asset_id', 'model', 'issue_description', 'status', 'latest_update', 'created_at', 'actions'];

  // API Base URL
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = user;
    this.loadInitialData();
  }

  // Load all initial data
  loadInitialData(): void {
    this.isLoading = true;
    Promise.all([
      this.fetchMyAssets(),
      this.fetchMyTicketsWithUpdates()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  // Fetch assets assigned to logged-in user
  fetchMyAssets(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiUrl}/assets?emp_email=${this.user.email}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.myAssets = response.data;
              console.log('My assets loaded:', this.myAssets);
            } else {
              console.error('Failed to fetch assets:', response.message);
            }
            resolve();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error fetching my assets:', err);
            this.showErrorMessage('Failed to load your assets. Please try again.');
            reject(err);
          }
        });
    });
  }

  // Fetch tickets with latest updates for logged-in user
  fetchMyTicketsWithUpdates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiUrl}/employee/tickets-with-updates?reported_by=${this.user.email}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.myTicketsWithUpdates = response.data;
              this.applyTicketFilters(); // Apply filters after fetching data
              console.log('My tickets with updates loaded:', this.myTicketsWithUpdates);
            } else {
              console.error('Failed to fetch tickets:', response.message);
            }
            resolve();
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error fetching tickets with updates:', err);
            this.showErrorMessage('Failed to load your tickets. Please try again.');
            reject(err);
          }
        });
    });
  }

  // ==================== FILTER METHODS ====================

  applyTicketFilters(): void {
    let filtered = [...this.myTicketsWithUpdates];

    // Search filter
    if (this.ticketFilters.search.trim()) {
      const searchTerm = this.ticketFilters.search.toLowerCase().trim();
      filtered = filtered.filter(ticket => 
        ticket.ticket_id.toLowerCase().includes(searchTerm) ||
        ticket.issue_description.toLowerCase().includes(searchTerm) ||
        ticket.asset_id.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.ticketFilters.status) {
      filtered = filtered.filter(ticket => ticket.status === this.ticketFilters.status);
    }

    // Date range filter
    if (this.ticketFilters.fromDate) {
      const fromDate = new Date(this.ticketFilters.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(ticket => new Date(ticket.created_at) >= fromDate);
    }

    if (this.ticketFilters.toDate) {
      const toDate = new Date(this.ticketFilters.toDate);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ticket => new Date(ticket.created_at) <= toDate);
    }

    this.filteredTickets = filtered;
  }

  clearAllFilters(): void {
    this.ticketFilters = {
      search: '',
      status: '',
      fromDate: null,
      toDate: null
    };
    this.applyTicketFilters();
  }

  clearFilter(filterName: keyof TicketFilters): void {
    switch (filterName) {
      case 'search':
        this.ticketFilters.search = '';
        break;
      case 'status':
        this.ticketFilters.status = '';
        break;
      case 'fromDate':
        this.ticketFilters.fromDate = null;
        break;
      case 'toDate':
        this.ticketFilters.toDate = null;
        break;
    }
    this.applyTicketFilters();
  }

  setQuickDateFilter(period: string): void {
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case 'today':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        this.ticketFilters.fromDate = fromDate;
        this.ticketFilters.toDate = new Date(now);
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        fromDate.setHours(0, 0, 0, 0);
        this.ticketFilters.fromDate = fromDate;
        this.ticketFilters.toDate = new Date(now);
        break;
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.ticketFilters.fromDate = fromDate;
        this.ticketFilters.toDate = new Date(now);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        fromDate = new Date(now.getFullYear(), quarter * 3, 1);
        this.ticketFilters.fromDate = fromDate;
        this.ticketFilters.toDate = new Date(now);
        break;
    }
    this.applyTicketFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.ticketFilters.search ||
      this.ticketFilters.status ||
      this.ticketFilters.fromDate ||
      this.ticketFilters.toDate
    );
  }

  // ==================== TICKET MENU MANAGEMENT ====================

  toggleTicketMenu(ticketId: string): void {
    if (this.openTicketMenuId === ticketId) {
      this.openTicketMenuId = null;
    } else {
      this.openTicketMenuId = ticketId;
    }
  }

  closeTicketMenu(): void {
    this.openTicketMenuId = null;
  }

  // ==================== TICKET UPDATE FUNCTIONALITY ====================

  openUpdateTicketModal(ticket: any): void {
    this.selectedTicketForUpdate = ticket;
    this.ticketUpdateRequest = {
      ticketId: ticket.ticket_id,
      message: '',
      proof: null
    };
    this.isUpdateTicketModalOpen = true;
  }

  closeUpdateTicketModal(): void {
    this.isUpdateTicketModalOpen = false;
    this.selectedTicketForUpdate = null;
    this.resetUpdateForm();
  }

  resetUpdateForm(): void {
    this.ticketUpdateRequest = {
      ticketId: '',
      message: '',
      proof: null
    };
    this.selectedUpdateFile = null;
    this.updateFileError = '';
  }

  onUpdateFileSelected(event: any): void {
    const file = event.target.files[0];
    this.updateFileError = '';
    
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5242880) {
        this.updateFileError = 'File size exceeds 5MB limit. Please choose a smaller file.';
        event.target.value = '';
        this.selectedUpdateFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/', 'video/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        this.updateFileError = 'Invalid file type. Only images and videos are allowed.';
        event.target.value = '';
        this.selectedUpdateFile = null;
        return;
      }

      this.selectedUpdateFile = file;
      console.log('Update file selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    }
  }

  submitTicketUpdate(): void {
    if (!this.ticketUpdateRequest.message) {
      this.showErrorMessage('Please provide a message for the update.');
      return;
    }

    if (this.updateFileError) {
      this.showErrorMessage('Please fix the file upload error before submitting.');
      return;
    }

    this.isSubmittingUpdate = true;

    // Create form data for file upload
    const formData = new FormData();
    formData.append('ticket_id', this.ticketUpdateRequest.ticketId);
    formData.append('message', this.ticketUpdateRequest.message);
    formData.append('updated_by', this.user.email);
    
    if (this.selectedUpdateFile) {
      formData.append('files', this.selectedUpdateFile);
    }

    this.http.post<any>(`${this.apiUrl}/employee/update-ticket`, formData).subscribe({
      next: (response) => {
        this.isSubmittingUpdate = false;
        if (response.success) {
          this.showSuccessMessage('Ticket updated successfully!');
          this.closeUpdateTicketModal();
          this.fetchMyTicketsWithUpdates(); // Refresh the tickets list
          
          // Refresh activity logs if we're on that tab
          if (this.activeTab === 'activity-logs') {
            setTimeout(() => {
              this.loadActivityLogsByTicket();
            }, 1000);
          }
        } else {
          this.showErrorMessage('Failed to update ticket: ' + response.message);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmittingUpdate = false;
        console.error('Error updating ticket:', err);
        let errorMessage = 'Failed to update ticket. Please try again.';
        
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.status === 413) {
          errorMessage = 'File too large. Please choose a smaller file.';
        }
        
        this.showErrorMessage(errorMessage);
      }
    });
  }

  // ==================== ACTIVITY LOGS BY TICKET ====================

  loadActivityLogsByTicket(): void {
    this.isLoadingActivityLogs = true;
    
    this.http.get<{ success: boolean; data: TicketActivityGroup[] }>
      (`${this.apiUrl}/employee/activity-logs-by-ticket?employee_email=${this.user.email}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.groupedActivityLogs = response.data;
            console.log('Grouped activity logs loaded:', this.groupedActivityLogs);
          } else {
            console.error('Failed to load grouped activity logs');
            this.groupedActivityLogs = [];
          }
          this.isLoadingActivityLogs = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading grouped activity logs:', error);
          this.groupedActivityLogs = [];
          this.isLoadingActivityLogs = false;
          this.showErrorMessage('Failed to load activity logs. Please try again.');
        }
      });
  }

  toggleTicketActivities(ticketId: string): void {
    if (this.expandedTicketIds.has(ticketId)) {
      this.expandedTicketIds.delete(ticketId);
    } else {
      this.expandedTicketIds.add(ticketId);
    }
  }

  toggleActivityAdditionalData(activityId: number): void {
    if (this.expandedActivityIds.has(activityId)) {
      this.expandedActivityIds.delete(activityId);
    } else {
      this.expandedActivityIds.add(activityId);
    }
  }

  // Tab navigation
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Load data when switching tabs
    if (tab === 'activity-logs' && this.groupedActivityLogs.length === 0) {
      this.loadActivityLogsByTicket();
    } else if (tab === 'my-tickets') {
      this.fetchMyTicketsWithUpdates();
    }
  }

  // Refresh methods
  refreshTickets(): void {
    this.fetchMyTicketsWithUpdates();
  }

  // Modal management
  openRaiseTicketModal(): void {
    if (this.myAssets.length === 0) {
      this.showErrorMessage('No assets assigned to you. Cannot raise a ticket.');
      return;
    }
    this.isRaiseTicketModalOpen = true;
  }

  closeRaiseTicketModal(): void {
    this.isRaiseTicketModalOpen = false;
    this.resetTicketForm();
  }

  openActivityLogModal(ticket: any): void {
    this.selectedTicket = ticket;
    this.selectedTicketActivities = [];
    this.isActivityLogModalOpen = true;
    this.fetchTicketActivityLogs(ticket.ticket_id);
  }

  closeActivityLogModal(): void {
    this.isActivityLogModalOpen = false;
    this.selectedTicket = null;
    this.selectedTicketActivities = [];
  }

  // Fetch activity logs for a specific ticket (legacy method for ticket modal)
  fetchTicketActivityLogs(ticketId: string): void {
    this.http.get<any>(`${this.apiUrl}/ticket-logs/${ticketId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedTicketActivities = response.data;
          } else {
            console.error('Failed to fetch ticket logs:', response.message);
            this.selectedTicketActivities = [];
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching ticket logs:', err);
          this.selectedTicketActivities = [];
        }
      });
  }

  // Reset ticket form
  resetTicketForm(): void {
    this.ticketRequest = {
      deviceId: '',
      description: '',
      proof: null
    };
    this.selectedFile = null;
    this.fileError = '';
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.fileError = '';
    
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5242880) {
        this.fileError = 'File size exceeds 5MB limit. Please choose a smaller file.';
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/', 'video/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        this.fileError = 'Invalid file type. Only images and videos are allowed.';
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      console.log('File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    }
  }

  // Submit ticket
  submitTicket(): void {
    if (!this.ticketRequest.deviceId || !this.ticketRequest.description) {
      this.showErrorMessage('Please fill in all required fields.');
      return;
    }

    if (this.fileError) {
      this.showErrorMessage('Please fix the file upload error before submitting.');
      return;
    }

    this.isSubmitting = true;

    // Create form data for file upload with correct field names
    const formData = new FormData();
    formData.append('asset_id', this.ticketRequest.deviceId);
    formData.append('issue_description', this.ticketRequest.description);
    formData.append('reported_by', this.user.email);
    formData.append('priority', 'Medium');
    
    if (this.selectedFile) {
      formData.append('files', this.selectedFile);
    }

    this.http.post<any>(`${this.apiUrl}/raise-ticket`, formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.showSuccessMessage('Ticket raised successfully!');
          this.closeRaiseTicketModal();
          this.fetchMyTicketsWithUpdates(); // Refresh the tickets list
          
          // Refresh activity logs if we're on that tab
          if (this.activeTab === 'activity-logs') {
            setTimeout(() => {
              this.loadActivityLogsByTicket();
            }, 1000);
          }
        } else {
          this.showErrorMessage('Failed to raise ticket: ' + response.message);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        console.error('Error raising ticket:', err);
        let errorMessage = 'Failed to raise ticket. Please try again.';
        
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.status === 413) {
          errorMessage = 'File too large. Please choose a smaller file.';
        }
        
        this.showErrorMessage(errorMessage);
      }
    });
  }

  // Cancel ticket
  cancelTicket(ticketId: string): void {
    if (!confirm('Are you sure you want to cancel this ticket?')) {
      return;
    }

    this.http.delete<any>(`${this.apiUrl}/tickets/${ticketId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Ticket cancelled successfully!');
            this.fetchMyTicketsWithUpdates(); // Refresh the tickets list
            
            // Refresh activity logs if we're on that tab
            if (this.activeTab === 'activity-logs') {
              setTimeout(() => {
                this.loadActivityLogsByTicket();
              }, 1000);
            }
          } else {
            this.showErrorMessage('Failed to cancel ticket: ' + response.message);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error cancelling ticket:', err);
          let errorMessage = 'Failed to cancel ticket. Please try again.';
          
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          }
          
          this.showErrorMessage(errorMessage);
        }
      });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format additional data for display
   */
  formatAdditionalData(additionalData: any): string {
    if (!additionalData) return '';
    
    try {
      if (typeof additionalData === 'string') {
        additionalData = JSON.parse(additionalData);
      }
      return JSON.stringify(additionalData, null, 2);
    } catch (e) {
      return additionalData.toString();
    }
  }

  /**
   * Get action type display name
   */
  getActionTypeDisplayName(actionType: string): string {
    const actionTypeMap: { [key: string]: string } = {
      'asset_allocated': 'Asset Allocated',
      'ticket_created': 'Ticket Created',
      'ticket_updated': 'Ticket Updated',
      'ticket_responded': 'HR Response',
      'ticket_cancelled': 'Ticket Cancelled',
      'evidence_uploaded': 'Evidence Uploaded',
      'employee_response': 'Employee Response',
      'status_updated': 'Status Updated',
      'information_request': 'Information Request',
      'hr_response': 'HR Response'
    };
    
    return actionTypeMap[actionType] || actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get action type color class
   */
  getActionTypeColorClass(actionType: string): string {
    const colorMap: { [key: string]: string } = {
      'asset_allocated': 'bg-green-500',
      'ticket_created': 'bg-blue-500',
      'ticket_updated': 'bg-indigo-500',
      'ticket_responded': 'bg-purple-500',
      'ticket_cancelled': 'bg-red-500',
      'evidence_uploaded': 'bg-yellow-500',
      'employee_response': 'bg-green-500',
      'status_updated': 'bg-orange-500',
      'information_request': 'bg-purple-500',
      'hr_response': 'bg-purple-500'
    };
    
    return colorMap[actionType] || 'bg-gray-500';
  }

  // Utility methods for user feedback
  private showSuccessMessage(message: string): void {
    alert('✅ ' + message);
  }

  private showErrorMessage(message: string): void {
    alert('❌ ' + message);
  }

  // Logout
  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }

  // Track by functions for ngFor performance
  trackByAssetId(index: number, asset: Asset): string {
    return asset.asset_id;
  }

  trackByTicketId(index: number, ticket: MaintenanceTicket): string {
    return ticket.ticket_id;
  }

  trackByActivityId(index: number, activity: ActivityLog): number {
    return activity.id;
  }

  trackByTicketGroupId(index: number, group: TicketActivityGroup): string {
    return group.ticket_id;
  }
}








