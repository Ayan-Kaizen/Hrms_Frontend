import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';

interface Evidence {
  type: 'image' | 'video';
  url: string;
  file_path?: string;
  file_type?: string;
}   

interface ActivityLogOld {
  timestamp: Date;
  message: string;
  user: string;
  device: string;
  issueType: string;
  addedBy: 'HR' | 'Employee';
}

interface UserActivity {
  userName: string;
  userInitials: string;
  device: string;
  issueType: string;
  activities: ActivityLogOld[];
}

interface DateGroup {
  date: Date;
  userActivities: { [key: string]: UserActivity };
}

export interface Asset {
  id?: number;
  assetId?: string;
  serialNumber: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  status: string;
  allocatedTo?: string;
  vendor: string;
  vendorEmail?: string;
  vendorContact?: string;
  warrantyExpiry?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  createdAt?: string;
  reason?: string;
}

export interface Vendor {
  id?: number;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface AssetResponse {
  success: boolean;
  data: Asset[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Ticket {
  ticket_id: string;
  asset_id: string;
  reported_by: string;
  issue_description: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to?: string;
  resolution_notes?: string;
  updated_at?: string;
  asset_model?: string;
  asset_name?: string;
  employee_name?: string;
  employee_id?: string;
  evidence: Evidence[];
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

interface GroupedActivityLog {
  employee_id?: string;
  employee_email?: string;
  employee_name?: string;
  activities: ActivityLog[];
}

@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management-hr.component.html',
  styleUrls: ['./asset-management-hr.component.css']
})
export class AssetManagementComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('vendorPaginator') vendorPaginator!: MatPaginator;
  @ViewChild('ticketPaginator') ticketPaginator!: MatPaginator;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  isSidebarMinimized = false;
  currentDate = new Date();
  activeSection = 'assets';
  
  getDepartmentName(grpId: number): string {
    const department = this.departmentOptions.find(dept => dept.grp_id === grpId);
    return department ? department.name : 'Unknown Department';
  }
  
  // Vendor Management
  vendorList: Vendor[] = [];
  vendorDataSource: MatTableDataSource<Vendor>;
  vendorDisplayedColumns: string[] = ['name', 'contactPerson', 'email', 'phone', 'actions'];
  showVendorModal = false;
  editingVendor: Vendor | null = null;
  selectedVendor: Vendor | null = null;
  vendorForm: FormGroup;
  allocationReason: string = '';
  
  // Asset Management
  showAssetModal = false;
  editingAsset: Asset | null = null;
  assetForm: FormGroup;
  nextAssetId: string | null = null;
  assetDataSource: MatTableDataSource<Asset>;

  assetDisplayedColumns: string[] = [
    'assetId', 'serialNumber', 'name', 'type', 'brandModel', 'status', 
    'allocatedTo', 'vendor', 'vendorContact', 'warrantyExpiry', 
    'createdAt', 'reason', 'actions' 
  ];
  
  // Filter Controls
  searchControl = new FormControl('');
  statusControl = new FormControl('');
  typeControl = new FormControl('');
  brandControl = new FormControl('');
  vendorControl = new FormControl('');
  
  // Filter Options
  statusOptions: string[] = ['', 'Available', 'Allocated', 'Maintenance', 'Retired'];
  typeOptions: string[] = ['', 'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Desktop', 'Printer', 'Server', 'Tablet'];
  brandOptions: string[] = ['', 'Dell', 'HP', 'Apple', 'Lenovo', 'Samsung', 'Acer', 'Asus', 'Microsoft'];
  vendorOptions: string[] = [''];
  
  // Department and Employee Options
  departmentOptions: { grp_id: number; name: string }[] = [];
  filteredEmployees: { employee_id: string; name: string; grp_id: number }[] = [];
  
  // Assets Data
  assets: Asset[] = [];
  totalAssets = 0;
  currentPage = 1;
  pageSize = 10;
  isLoading = false;

  // Ticket Management - Updated for real data
  tickets: Ticket[] = [];
  ticketDataSource: MatTableDataSource<Ticket>;
  ticketDisplayedColumns: string[] = ['ticket_id', 'employee_id', 'employee_name', 'asset_id', 'asset_model', 'status', 'priority', 'issue_description', 'evidence', 'actions'];
  selectedTicket: Ticket | null = null;
  ticketResponse = '';
  informationRequest = '';
  selectedEvidence: Evidence | null = null;
  
  // Ticket Statistics - Updated for real data
  activeTickets = 0;
  closedTickets = 0;
  pendingTickets = 0;
  escalatedTickets = 0;
  underReviewTickets = 0;
  totalTickets = 0;
  
  // Ticket Filtering
  currentTicketFilter = 'all';
  isLoadingTickets = false;
  
  // Activity Logs - Legacy (kept for backwards compatibility)
  activityLogs: ActivityLogOld[] = [
    { 
      timestamp: new Date('2023-10-30T09:15:00'), 
      message: 'Device allocated to Raj Sharma', 
      user: 'Raj Sharma', 
      device: 'MacBook Pro', 
      issueType: 'Hardware Issue',
      addedBy: 'HR'
    },
    { 
      timestamp: new Date('2023-10-30T10:30:00'), 
      message: 'Issue reported: Laptop not turning on', 
      user: 'Raj Sharma', 
      device: 'MacBook Pro', 
      issueType: 'Hardware Issue',
      addedBy: 'Employee'
    },
    { 
      timestamp: new Date('2023-10-30T11:45:00'), 
      message: 'Technician assigned to ticket', 
      user: 'Raj Sharma', 
      device: 'MacBook Pro', 
      issueType: 'Hardware Issue',
      addedBy: 'HR'
    },
    { 
      timestamp: new Date('2023-10-30T14:20:00'), 
      message: 'Device repaired and returned', 
      user: 'Raj Sharma', 
      device: 'MacBook Pro', 
      issueType: 'Hardware Issue',
      addedBy: 'HR'
    },
    { 
      timestamp: new Date('2023-10-29T08:30:00'), 
      message: 'New monitor requested', 
      user: 'Priya Patel', 
      device: 'Dell Monitor', 
      issueType: 'Display Issue',
      addedBy: 'Employee'
    },
    { 
      timestamp: new Date('2023-10-29T09:45:00'), 
      message: 'Monitor replacement approved', 
      user: 'Priya Patel', 
      device: 'Dell Monitor', 
      issueType: 'Display Issue',
      addedBy: 'HR'
    }
  ];

  // New Activity Logs Properties
  newActivityLogs: ActivityLog[] = [];
  groupedActivityLogs: GroupedActivityLog[] = [];
  isLoadingActivityLogs = false;
  expandedActivityIds = new Set<number>();
  
  // Activity Logs Filters
  activityLogFilters = {
    employeeName: '',
    employeeId: '',
    startDate: '',
    endDate: ''
  };
  
  // Activity Logs Pagination
  currentActivityPage = 1;
  totalActivityPages = 1;
  activityPageSize = 20;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Initialize vendor form
    this.vendorForm = this.fb.group({
      name: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
    
    // Initialize asset form
    this.assetForm = this.fb.group({
      assetId: ['', Validators.required],
      serialNumber: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      status: ['Available', Validators.required],
      allocatedTo: [''],
      vendor: ['', Validators.required],
      vendorEmail: ['', [Validators.required, Validators.email]],
      vendorContact: ['', Validators.required],
      warrantyExpiry: [''],
      purchaseDate: [''],
      purchaseCost: ['']
    });
    
    // Initialize data sources
    this.vendorDataSource = new MatTableDataSource(this.vendorList);
    this.assetDataSource = new MatTableDataSource(this.assets);
    this.ticketDataSource = new MatTableDataSource(this.tickets);
  }

  ngOnInit(): void {
    // Initialize asset form
    this.assetForm = this.fb.group({
      assetId: ['', Validators.required],
      serialNumber: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      status: ['Available', Validators.required],
      allocatedTo: [''],
      vendor: ['', Validators.required],
      vendorEmail: ['', [Validators.required, Validators.email]],
      vendorContact: ['', Validators.required],
      warrantyExpiry: [''],
      purchaseDate: [''],
      purchaseCost: ['']
    });

    this.loadAssets();
    this.loadVendors();
    this.loadTickets();
    this.loadTicketStatistics();
    this.setupFilterSubscriptions();
    this.loadActivityLogs(); // Load activity logs on init
  }

  ngAfterViewInit() {
    this.assetDataSource.sort = this.sort;
    this.assetDataSource.paginator = this.paginator;
    this.vendorDataSource.paginator = this.vendorPaginator;
    this.ticketDataSource.paginator = this.ticketPaginator;
    
    this.setCustomFilterPredicate();
  }

  setupFilterSubscriptions(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
      });
    
    this.statusControl.valueChanges.subscribe(() => this.applyFilters());
    this.typeControl.valueChanges.subscribe(() => this.applyFilters());
    this.brandControl.valueChanges.subscribe(() => this.applyFilters());
    this.vendorControl.valueChanges.subscribe(() => this.applyFilters());
  }

  onSidebarToggle(isMinimized: boolean) {
    this.isSidebarMinimized = isMinimized;
  }

  // ==================== ACTIVITY LOGS METHODS ====================

  /**
   * Load activity logs with current filters and pagination
   */
  loadActivityLogs(): void {
    this.isLoadingActivityLogs = true;
    
    let params = new HttpParams()
      .set('page', this.currentActivityPage.toString())
      .set('limit', this.activityPageSize.toString())
      .set('group_by', 'employee');

    // Apply filters
    if (this.activityLogFilters.employeeName.trim()) {
      params = params.set('employee_name', this.activityLogFilters.employeeName.trim());
    }
    
    if (this.activityLogFilters.employeeId.trim()) {
      params = params.set('employee_id', this.activityLogFilters.employeeId.trim());
    }
    
    if (this.activityLogFilters.startDate) {
      params = params.set('start_date', this.activityLogFilters.startDate);
    }
    
    if (this.activityLogFilters.endDate) {
      params = params.set('end_date', this.activityLogFilters.endDate);
    }

    this.http.get<{ success: boolean; data: GroupedActivityLog[]; grouped: boolean }>
      ('http://localhost:3000/api/hr/activity-logs', { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            if (response.grouped) {
              this.groupedActivityLogs = response.data;
            } else {
              // If not grouped, group them manually (fallback)
              this.groupedActivityLogs = this.groupActivitiesByEmployee(response.data as any);
            }
            console.log('Activity logs loaded:', this.groupedActivityLogs);
          } else {
            console.error('Failed to load activity logs');
            this.groupedActivityLogs = [];
          }
          this.isLoadingActivityLogs = false;
        },
        error: (error) => {
          console.error('Error loading activity logs:', error);
          this.groupedActivityLogs = [];
          this.isLoadingActivityLogs = false;
        }
      });
  }

  /**
   * Group activities by employee (fallback method)
   */
  private groupActivitiesByEmployee(activities: ActivityLog[]): GroupedActivityLog[] {
    const grouped: { [key: string]: GroupedActivityLog } = {};
    
    activities.forEach(activity => {
      const key = `${activity.employee_id || 'unknown'}-${activity.employee_email || 'unknown'}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          employee_id: activity.employee_id,
          employee_email: activity.employee_email,
          employee_name: activity.employee_name,
          activities: []
        };
      }
      
      grouped[key].activities.push(activity);
    });

    // Sort activities within each group by date (most recent first)
    Object.values(grouped).forEach(group => {
      group.activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    return Object.values(grouped);
  }

  /**
   * Handle filter changes with debouncing
   */
  onFilterChange(): void {
    // Reset to first page when filters change
    this.currentActivityPage = 1;
    
    // Debounce the filter changes
    setTimeout(() => {
      this.loadActivityLogs();
    }, 300);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.activityLogFilters = {
      employeeName: '',
      employeeId: '',
      startDate: '',
      endDate: ''
    };
    this.currentActivityPage = 1;
    this.loadActivityLogs();
  }

  /**
   * Load next page of activity logs
   */
  loadNextActivityPage(): void {
    if (this.currentActivityPage < this.totalActivityPages) {
      this.currentActivityPage++;
      this.loadActivityLogs();
    }
  }

  /**
   * Load previous page of activity logs
   */
  loadPreviousActivityPage(): void {
    if (this.currentActivityPage > 1) {
      this.currentActivityPage--;
      this.loadActivityLogs();
    }
  }

  /**
   * Toggle additional data visibility for an activity
   */
  toggleAdditionalData(activityId: number): void {
    if (this.expandedActivityIds.has(activityId)) {
      this.expandedActivityIds.delete(activityId);
    } else {
      this.expandedActivityIds.add(activityId);
    }
  }

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
   * Get employee initials for avatar
   */
 getEmployeeInitials(name: string | undefined): string {
  if (!name) return 'N/A';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

  /**
   * Get action type display name
   */
  getActionTypeDisplayName(actionType: string): string {
    const actionTypeMap: { [key: string]: string } = {
      'asset_allocated': 'Asset Allocated',
      'ticket_raised': 'Ticket Raised',
      'ticket_responded': 'HR Responded',
      'asset_returned': 'Asset Returned',
      'asset_updated': 'Asset Updated',
      'ticket_updated': 'Ticket Updated'
    };
    
    return actionTypeMap[actionType] || actionType.replace('_', ' ').toUpperCase();
  }

  /**
   * Get action type color class
   */
  getActionTypeColorClass(actionType: string): string {
    const colorMap: { [key: string]: string } = {
      'asset_allocated': 'bg-green-100 text-green-600',
      'ticket_raised': 'bg-blue-100 text-blue-600',
      'ticket_responded': 'bg-purple-100 text-purple-600',
      'asset_returned': 'bg-yellow-100 text-yellow-600',
      'asset_updated': 'bg-orange-100 text-orange-600',
      'ticket_updated': 'bg-indigo-100 text-indigo-600'
    };
    
    return colorMap[actionType] || 'bg-gray-100 text-gray-600';
  }

  // ==================== TICKET MANAGEMENT FUNCTIONS ====================

  // Load tickets from API
  loadTickets(status: string = 'all'): void {
    this.isLoadingTickets = true;
    this.currentTicketFilter = status;
    
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    this.http.get<{ success: boolean; data: Ticket[] }>('http://localhost:3000/api/hr/tickets', { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tickets = response.data.map(ticket => ({
              ...ticket,
              evidence: ticket.evidence?.map(e => ({
                type: e.file_type === 'video' ? 'video' : 'image',
                url: `http://localhost:3000/uploads/${e.file_path}`,
                file_path: e.file_path,
                file_type: e.file_type
              })) || []
            }));
            this.ticketDataSource.data = this.tickets;
          } else {
            console.error('Failed to load tickets');
            this.tickets = [];
            this.ticketDataSource.data = [];
          }
          this.isLoadingTickets = false;
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          this.tickets = [];
          this.ticketDataSource.data = [];
          this.isLoadingTickets = false;
        }
      });
  }

  // Load ticket statistics
  loadTicketStatistics(): void {
    this.http.get<{ success: boolean; data: any }>('http://localhost:3000/api/hr/ticket-stats')
      .subscribe({
        next: (response) => {
          if (response.success) {
            const stats = response.data;
            this.activeTickets = stats.open || 0;
            this.closedTickets = stats.closed || 0;
            this.escalatedTickets = stats.escalated || 0;
            this.underReviewTickets = stats['under review'] || 0;
            this.pendingTickets = this.escalatedTickets + this.underReviewTickets;
            this.totalTickets = stats.total || 0;
          }
        },
        error: (error) => {
          console.error('Error loading ticket statistics:', error);
        }
      });
  }

  // Filter tickets by status
  filterTicketsByStatus(status: string): void {
    this.activeSection = 'tickets';
    
    const statusMap: { [key: string]: string } = {
      'active': 'Open',
      'closed': 'Closed',
      'escalated': 'Escalated',
      'pending': 'Under Review',
      'under-review': 'Under Review'
    };
    
    const dbStatus = statusMap[status] || status;
    this.loadTickets(dbStatus);
  }

  // Open ticket action modal
openTicketAction(ticket: Ticket): void {
  this.selectedTicket = { ...ticket };
  this.ticketResponse = ticket.resolution_notes || '';
  this.informationRequest = '';
}

  // Submit ticket action
  submitTicketAction(): void {
    if (!this.selectedTicket) return;

    const updateData: any = {};
    
    if (this.selectedTicket.status) {
      updateData.status = this.selectedTicket.status;
    }
    
    if (this.ticketResponse && this.ticketResponse.trim()) {
      updateData.hrResponse = this.ticketResponse.trim();
    }
    
    if (this.informationRequest && this.informationRequest.trim()) {
      updateData.informationRequest = this.informationRequest.trim();
    }

    if (Object.keys(updateData).length === 0) {
      alert('Please provide a response or update the status.');
      return;
    }

    this.http.put(`http://localhost:3000/api/hr/tickets/${this.selectedTicket.ticket_id}`, updateData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const ticketIndex = this.tickets.findIndex(t => t.ticket_id === this.selectedTicket!.ticket_id);
            if (ticketIndex !== -1) {
              this.tickets[ticketIndex] = { ...this.tickets[ticketIndex], ...updateData };
              this.ticketDataSource.data = [...this.tickets];
            }
            
            this.loadTicketStatistics();
            this.loadTickets(this.currentTicketFilter);
            
            this.addToActivityLogs(this.selectedTicket!, updateData);
            
            alert('Ticket updated successfully!');
            this.selectedTicket = null;
            this.ticketResponse = '';
            this.informationRequest = '';

            // Refresh activity logs to show the new entry
            if (this.activeSection === 'logs') {
              setTimeout(() => {
                this.loadActivityLogs();
              }, 1000);
            }
          } else {
            alert('Failed to update ticket. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error updating ticket:', error);
          alert('Error updating ticket. Please try again.');
        }
      });
  }

  // Add ticket action to activity logs
  addToActivityLogs(ticket: Ticket, updateData: any): void {
    const now = new Date();
    
    if (updateData.hrResponse) {
      this.activityLogs.unshift({
        timestamp: now,
        message: `HR Response: ${updateData.hrResponse}`,
        user: ticket.employee_name || ticket.reported_by,
        device: ticket.asset_name || ticket.asset_id,
        issueType: 'Ticket Update',
        addedBy: 'HR'
      });
    }
    
    if (updateData.informationRequest) {
      this.activityLogs.unshift({
        timestamp: now,
        message: `Information Request: ${updateData.informationRequest}`,
        user: ticket.employee_name || ticket.reported_by,
        device: ticket.asset_name || ticket.asset_id,
        issueType: 'Information Request',
        addedBy: 'HR'
      });
    }
    
    if (updateData.status) {
      this.activityLogs.unshift({
        timestamp: now,
        message: `Status updated to: ${updateData.status}`,
        user: ticket.employee_name || ticket.reported_by,
        device: ticket.asset_name || ticket.asset_id,
        issueType: 'Status Update',
        addedBy: 'HR'
      });
    }
  }

  // Open evidence modal
  openEvidenceModal(evidence: Evidence): void {
    this.selectedEvidence = evidence;
  }

  // ==================== ASSET MANAGEMENT FUNCTIONS ====================

  private mapAssetFromAPI(apiAsset: any): Asset {
    return {
      id: apiAsset.id,
      assetId: apiAsset.asset_id,
      serialNumber: apiAsset.serial_no,
      name: apiAsset.name,
      type: apiAsset.type,
      brand: apiAsset.brand,
      model: apiAsset.model,
      status: apiAsset.status,
      allocatedTo: apiAsset.allocated_to,
      vendor: apiAsset.vendor,
      vendorEmail: apiAsset.vendor_email,
      vendorContact: apiAsset.vendor_contact,
      warrantyExpiry: apiAsset.warranty_expiry,
      purchaseDate: apiAsset.purchase_date,
      purchaseCost: apiAsset.purchase_cost,
      createdAt: apiAsset.created_at,
      reason: apiAsset.reason || apiAsset.notes
    };
  }

  applyFilters(): void {
    const search = this.searchControl.value?.toLowerCase() || '';
    const status = this.statusControl.value || '';
    const type = this.typeControl.value || '';
    const brand = this.brandControl.value || '';
    const vendor = this.vendorControl.value || '';
    
    this.assetDataSource.filter = JSON.stringify({
      search, status, type, brand, vendor
    });
    
    if (this.assetDataSource.paginator) {
      this.assetDataSource.paginator.firstPage();
    }
  }

  setCustomFilterPredicate() {
    this.assetDataSource.filterPredicate = (data: Asset, filter: string): boolean => {
      const filterObject = JSON.parse(filter);
      const searchStr = filterObject.search;
      
      const matchesSearch = !searchStr || 
        data.serialNumber.toLowerCase().includes(searchStr) ||
        data.name.toLowerCase().includes(searchStr) ||
        data.type.toLowerCase().includes(searchStr) ||
        data.brand.toLowerCase().includes(searchStr) ||
        data.model.toLowerCase().includes(searchStr) ||
        (data.allocatedTo && data.allocatedTo.toLowerCase().includes(searchStr)) ||
        data.vendor.toLowerCase().includes(searchStr);
      
      const matchesStatus = !filterObject.status || data.status === filterObject.status;
      const matchesType = !filterObject.type || data.type === filterObject.type;
      const matchesBrand = !filterObject.brand || data.brand === filterObject.brand;
      const matchesVendor = !filterObject.vendor || data.vendor === filterObject.vendor;
      
      return matchesSearch && matchesStatus && matchesType && matchesBrand && matchesVendor;
    };
  }

  loadAssets(): void {
    this.isLoading = true;
    
    this.http.get<any>('http://localhost:3000/api/assets')
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.assets = response.data.map((asset: any) => this.mapAssetFromAPI(asset));
            this.assetDataSource.data = this.assets;
            this.totalAssets = response.pagination?.total || this.assets.length;
            
            setTimeout(() => {
              this.setCustomFilterPredicate();
              this.applyFilters();
            });
          } else {
            this.useDemoAssets();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading assets:', error);
          this.useDemoAssets();
          this.isLoading = false;
        }
      });
  }

  useDemoAssets(): void {
    this.assets = [
      { 
        serialNumber: 'SN001', 
        name: 'MacBook Pro', 
        type: 'Laptop', 
        brand: 'Apple', 
        model: 'M1 2021', 
        status: 'Allocated', 
        allocatedTo: 'Raj Sharma', 
        vendor: 'Tech Suppliers Inc.', 
        vendorEmail: 'contact@techsuppliers.com', 
        vendorContact: 'John Doe', 
        warrantyExpiry: '2024-12-15' 
      },
      { 
        serialNumber: 'SN002', 
        name: 'UltraSharp Monitor', 
        type: 'Monitor', 
        brand: 'Dell', 
        model: 'U2720Q', 
        status: 'Available', 
        allocatedTo: '', 
        vendor: 'Hardware Solutions', 
        vendorEmail: 'sales@hardwaresolutions.com', 
        vendorContact: 'Jane Smith', 
        warrantyExpiry: '2025-03-20' 
      }
    ];
    this.assetDataSource.data = this.assets;
    this.totalAssets = this.assets.length;
    
    setTimeout(() => {
      this.setCustomFilterPredicate();
      this.applyFilters();
    });
  }

  loadVendors(): void {
    this.http.get<{ success: boolean; data: any[] }>('http://localhost:3000/api/vendors')
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.vendorList = response.data.map(vendor => ({
              id: vendor.id,
              name: vendor.name,
              contactPerson: vendor.contact_person,
              email: vendor.email,
              phone: vendor.phone,
              address: vendor.address
            }));
            this.vendorDataSource.data = this.vendorList;
            this.vendorOptions = ['', ...this.vendorList.map(v => v.name)];
          } else {
            this.useDemoVendors();
          }
        },
        error: (error) => {
          console.error('Error loading vendors:', error);
          this.useDemoVendors();
        }
      });
  }

  useDemoVendors(): void {
    this.vendorList = [
      { name: 'Tech Suppliers Inc.', contactPerson: 'John Doe', email: 'john@techsuppliers.com', phone: '+1-555-0123', address: '123 Tech Park, City' },
      { name: 'Hardware Solutions', contactPerson: 'Jane Smith', email: 'jane@hardwaresolutions.com', phone: '+1-555-0456', address: '45 Hardware Ave, City' },
      { name: 'IT Equipment Co.', contactPerson: 'Robert Johnson', email: 'robert@itequipment.com', phone: '+1-555-0789', address: '9 Industrial Rd, City' }
    ];
    this.vendorDataSource.data = this.vendorList;
    this.vendorOptions = ['', ...this.vendorList.map(v => v.name)];
  }

  onDepartmentChange(event: any): void {
    const departmentId = event.target.value;
    this.filteredEmployees = [];
    
    if (!departmentId) {
      this.assetForm.get('allocatedTo')?.setValue('');
      return;
    }
    
    this.http.get<any>('http://localhost:3000/api/employees/by-group', {
      params: new HttpParams().set('grp_id', departmentId)
    }).subscribe({
      next: (resp) => {
        if (resp?.success && Array.isArray(resp.data)) {
          this.filteredEmployees = resp.data;
        } else {
          this.filteredEmployees = [];
        }
        this.assetForm.get('allocatedTo')?.setValue('');
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.filteredEmployees = [];
        this.assetForm.get('allocatedTo')?.setValue('');
      }
    });
  }

  onVendorChange(event: any): void {
    const vendorName = event.target.value;
    if (vendorName) {
      const vendor = this.vendorList.find(v => v.name === vendorName);
      if (vendor) {
        this.assetForm.patchValue({
          vendorEmail: vendor.email,
          vendorContact: vendor.contactPerson
        });
      }
    } else {
      this.assetForm.patchValue({
        vendorEmail: '',
        vendorContact: ''
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAssets();
  }

  openAddAssetModal(): void {
    this.editingAsset = null;
    this.assetForm.reset({
      status: 'Available'
    });
    this.filteredEmployees = [];
    this.allocationReason = '';
    this.showAssetModal = true;

    this.http.get<any>('http://localhost:3000/api/assets/next-id')
      .subscribe({
        next: (resp) => {
          if (resp?.success && resp?.data?.nextId) {
            this.nextAssetId = resp.data.nextId;
            this.assetForm.patchValue({ assetId: this.nextAssetId });
          } else {
            this.nextAssetId = null;
          }
        },
        error: () => {
          this.nextAssetId = null;
        }
      });

    this.http.get<any>('http://localhost:3000/api/departments')
      .subscribe({
        next: (resp) => {
          if (resp?.success && Array.isArray(resp.data)) {
            this.departmentOptions = resp.data;
          } else {
            this.departmentOptions = [];
          }
        },
        error: () => {
          this.departmentOptions = [];
        }
      });
  }

  editAsset(asset: Asset): void {
    this.editingAsset = asset;
    
    this.assetForm.patchValue({
      assetId: asset.assetId,
      serialNumber: asset.serialNumber,
      name: asset.name,
      type: asset.type,
      brand: asset.brand,
      model: asset.model,
      status: asset.status,
      allocatedTo: asset.allocatedTo,
      vendor: asset.vendor,
      vendorEmail: asset.vendorEmail,
      vendorContact: asset.vendorContact,
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: asset.purchaseCost
    });
    
    this.filteredEmployees = [];
    this.showAssetModal = true;
  }

  closeAddAssetModal(): void {
    this.showAssetModal = false;
    this.editingAsset = null;
    this.assetForm.reset();
    this.filteredEmployees = [];
    this.allocationReason = '';
  }

  onAssetSubmit(): void {
    const formValue = this.assetForm.value;
    const status = formValue.status;
    
    if ((status === 'Maintenance' || status === 'Retired') && !this.allocationReason?.trim()) {
      alert('Please provide a reason for Maintenance or Retired status.');
      return;
    }

    const formWithoutReason = { ...this.assetForm.controls };
    
    const mainFormValid = Object.keys(formWithoutReason).every(key => 
      this.assetForm.get(key)?.valid || this.assetForm.get(key)?.disabled
    );

    if (mainFormValid) {
      const apiPayload: any = {
        asset_id: formValue.assetId || this.nextAssetId,
        serial_number: formValue.serialNumber,
        name: formValue.name,
        type: formValue.type,
        brand: formValue.brand,
        model: formValue.model,
        status: formValue.status,
        allocated_to: formValue.allocatedTo || null,
        vendor: formValue.vendor,
        vendor_email: formValue.vendorEmail,
        vendor_contact: formValue.vendorContact,
        warranty_expiry: formValue.warrantyExpiry || null,
        purchase_date: formValue.purchaseDate || null,
        purchase_cost: formValue.purchaseCost || null
      };

      if ((status === 'Maintenance' || status === 'Retired') && this.allocationReason?.trim()) {
        apiPayload.reason = this.allocationReason.trim();
      }
      
      Object.keys(apiPayload).forEach(key => {
        if (apiPayload[key] === '') {
          apiPayload[key] = null;
        }
      });
      
      if (this.editingAsset) {
        this.http.put(`http://localhost:3000/api/assets/${this.editingAsset.assetId}`, apiPayload)
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.loadAssets();
                this.closeAddAssetModal();
                alert('Asset updated successfully!');
                
                // Refresh activity logs to show the new entry
                if (this.activeSection === 'logs') {
                  setTimeout(() => {
                    this.loadActivityLogs();
                  }, 1000);
                }
              } else {
                alert('Failed to update asset. Please try again.');
              }
            },
            error: (error) => {
              console.error('Error updating asset:', error);
              alert('Error updating asset. Please try again.');
            }
          });
      } else {
        this.http.post('http://localhost:3000/api/assets', apiPayload)
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.loadAssets();
                this.closeAddAssetModal();
                alert('Asset added successfully!');
                this.nextAssetId = null;
                this.allocationReason = '';
                
                // Refresh activity logs to show the new entry
                if (this.activeSection === 'logs') {
                  setTimeout(() => {
                    this.loadActivityLogs();
                  }, 1000);
                }
              } else {
                alert(`Failed to add asset: ${response.message || 'Please try again.'}`);
              }
            },
            error: (error) => {
              console.error('Error creating asset:', error);
              const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
              alert(`Error creating asset: ${errorMessage}`);
            }
          });
      }
    } else {
      Object.keys(formWithoutReason).forEach(key => {
        this.assetForm.get(key)?.markAsTouched();
      });
      
      const invalidFields = Object.keys(formWithoutReason)
        .filter(key => this.assetForm.get(key)?.invalid)
        .join(', ');
      
      alert(`Please fill all required fields correctly. Invalid fields: ${invalidFields}`);
    }
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`Are you sure you want to delete asset ${asset.serialNumber}?`)) {
      this.http.delete(`http://localhost:3000/api/assets/${asset.assetId || asset.serialNumber}`)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadAssets();
              alert('Asset deleted successfully!');
            } else {
              alert('Failed to delete asset. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error deleting asset:', error);
            alert('Error deleting asset. Please try again.');
          }
        });
    }
  }

  // ==================== VENDOR MANAGEMENT FUNCTIONS ====================

  openAddVendorModal(): void {
    this.editingVendor = null;
    this.vendorForm.reset();
    this.showVendorModal = true;
  }

  editVendor(vendor: Vendor): void {
    this.editingVendor = vendor;
    this.vendorForm.patchValue(vendor);
    this.showVendorModal = true;
  }

  closeAddVendorModal(): void {
    this.showVendorModal = false;
    this.editingVendor = null;
    this.vendorForm.reset();
  }

  onVendorSubmit(): void {
    if (this.vendorForm.valid) {
      const formValue = this.vendorForm.value;
      
      const apiPayload = {
        name: formValue.name,
        contact_person: formValue.contactPerson,
        email: formValue.email,
        phone: formValue.phone || null,
        address: formValue.address || null
      };
      
      if (this.editingVendor) {
        this.http.put(`http://localhost:3000/api/vendors/${this.editingVendor.id}`, apiPayload)
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.loadVendors();
                this.closeAddVendorModal();
                alert('Vendor updated successfully!');
              } else {
                alert('Failed to update vendor. Please try again.');
              }
            },
            error: (error) => {
              console.error('Error updating vendor:', error);
              alert('Error updating vendor. Please try again.');
            }
          });
      } else {
        this.http.post('http://localhost:3000/api/vendors', apiPayload)
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.loadVendors();
                this.closeAddVendorModal();
                alert('Vendor added successfully!');
              } else {
                alert('Failed to add vendor. Please try again.');
              }
            },
            error: (error) => {
              console.error('Error creating vendor:', error);
              alert('Error creating vendor. Please try again.');
            }
          });
      }
    } else {
      Object.keys(this.vendorForm.controls).forEach(key => {
        this.vendorForm.get(key)?.markAsTouched();
      });
      alert('Please fill all required fields correctly.');
    }
  }

  deleteVendor(vendor: Vendor): void {
    if (confirm(`Are you sure you want to delete vendor ${vendor.name}?`)) {
      this.http.delete(`http://localhost:3000/api/vendors/${vendor.id}`)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadVendors();
              alert('Vendor deleted successfully!');
            } else {
              alert('Failed to delete vendor. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error deleting vendor:', error);
            alert('Error deleting vendor. Please try again.');
          }
        });
    }
  }

  // ==================== ACTIVITY LOGS (LEGACY) ====================

  get groupedActivityLogs_legacy() {
    const grouped: { [key: string]: DateGroup } = {};
    
    this.activityLogs.forEach(log => {
      const dateStr = log.timestamp.toDateString();
      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: log.timestamp,
          userActivities: {}
        };
      }
      
      const userKey = `${log.user}-${log.device}-${log.issueType}`;
      if (!grouped[dateStr].userActivities[userKey]) {
        grouped[dateStr].userActivities[userKey] = {
          userName: log.user,
          userInitials: this.getInitials(log.user),
          device: log.device,
          issueType: log.issueType,
          activities: []
        };
      }
      
      grouped[dateStr].userActivities[userKey].activities.push(log);
    });
    
    return Object.keys(grouped).map(date => {
      return {
        date: grouped[date].date,
        userActivities: Object.values(grouped[date].userActivities)
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}





