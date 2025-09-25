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
  allocatedToOffice?: string;
  location?: string;
  vendor: string;
  vendorEmail?: string;
  vendorContact?: string;
  warrantyExpiry?: string;
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

export interface Ticket {
  ticket_id: string;
  asset_id: string;
  reported_by: string;
  issue_description: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  resolution_notes?: string;
  updated_at?: string;
  asset_model?: string;
  asset_name?: string;
  employee_name?: string;
  employee_id?: string;
  evidence: Evidence[];
  priority: 'Low' | 'Medium' | 'High';
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
  
  // Asset Management
  showAssetModal = false;
  editingAsset: Asset | null = null;
  assetForm: FormGroup;
  nextAssetId: string | null = null;
  assetDataSource: MatTableDataSource<Asset>;

  assetDisplayedColumns: string[] = [
    'index', 'assetId', 'serialNumber', 'name', 'type', 'brandModel', 'status', 
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
  locationOptions: string[] = ['1st Floor', '2nd Floor', '3rd Floor'];
  
  // Department and Employee Options
  departmentOptions: { grp_id: number; name: string }[] = [];
  filteredEmployees: { employee_id: string; name: string; grp_id: number }[] = [];
  
  // Assets Data
  assets: Asset[] = [];
  totalAssets = 0;
  currentPage = 1;
  pageSize = 10;
  isLoading = false;

  // Ticket Management
  tickets: Ticket[] = [];
  ticketDataSource: MatTableDataSource<Ticket>;
  ticketDisplayedColumns: string[] = ['ticket_id', 'employee_id', 'employee_name', 'asset_id', 'asset_model', 'status', 'issue_description', 'evidence', 'actions'];
  selectedTicket: Ticket | null = null;
  ticketResponse = '';
  selectedEvidence: Evidence | null = null;
  
  // Ticket Statistics
  activeTickets = 0;
  closedTickets = 0;
  pendingTickets = 0;
  escalatedTickets = 0;
  underReviewTickets = 0;
  totalTickets = 0;
  
  // Ticket Filtering
  currentTicketFilter = 'all';
  isLoadingTickets = false;
  
  // Asset Activity Logs
  groupedAssetActivityLogs: GroupedActivityLog[] = [];
  isLoadingAssetActivityLogs = false;
  assetActivityFilters = {
    employeeName: '',
    employeeId: '',
    startDate: '',
    endDate: ''
  };
  currentAssetActivityPage = 1;
  totalAssetActivityPages = 1;
  assetActivityPageSize = 20;

  // Ticket Activity Logs
  groupedTicketActivityLogs: GroupedActivityLog[] = [];
  isLoadingTicketActivityLogs = false;
  ticketActivityFilters = {
    employeeName: '',
    employeeId: '',
    startDate: '',
    endDate: ''
  };
  currentTicketActivityPage = 1;
  totalTicketActivityPages = 1;
  ticketActivityPageSize = 20;

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
    
    // Initialize asset form with new fields
    this.assetForm = this.fb.group({
      assetId: ['', Validators.required],
      serialNumber: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      status: ['Available', Validators.required],
      allocateTo: [''], // New field: office or employee
      allocatedTo: [''], // Employee ID
      allocatedToOffice: [''], // Office allocation flag
      location: [''], // Location for office allocation
      vendor: ['', Validators.required],
      vendorEmail: ['', [Validators.required, Validators.email]],
      vendorContact: ['', Validators.required],
      warrantyExpiry: [''],
      reason: [''] // New field for Maintenance/Retired
    });
    
    // Initialize data sources
    this.vendorDataSource = new MatTableDataSource(this.vendorList);
    this.assetDataSource = new MatTableDataSource(this.assets);
    this.ticketDataSource = new MatTableDataSource(this.tickets);
  }

  ngOnInit(): void {
    this.loadAssets();
    this.loadVendors();
    this.loadTickets();
    this.loadTicketStatistics();
    this.setupFilterSubscriptions();
    this.loadAssetActivityLogs();
    this.loadTicketActivityLogs();
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

  // ==================== ENHANCED STATUS CHANGE HANDLER ====================
  onStatusChange(event: any): void {
    const status = event.target.value;
    
    if (status === 'Available') {
      // Clear all allocation fields
      this.assetForm.patchValue({
        allocateTo: '',
        allocatedTo: '',
        allocatedToOffice: '',
        location: '',
        reason: ''
      });
      this.filteredEmployees = [];
    } else if (status === 'Allocated') {
      // Enable allocation fields
      this.loadDepartments();
      this.assetForm.patchValue({
        reason: ''
      });
    } else if (status === 'Maintenance') {
      // Keep current allocation but add reason requirement
      // Don't clear allocation fields for maintenance
    } else if (status === 'Retired') {
      // Clear allocation and require reason
      this.assetForm.patchValue({
        allocateTo: '',
        allocatedTo: '',
        allocatedToOffice: '',
        location: ''
      });
      this.filteredEmployees = [];
    }
  }

  // ==================== NEW ALLOCATE TO HANDLER ====================
  onAllocateToChange(event: any): void {
    const allocateType = event.target.value;
    
    if (allocateType === 'office') {
      // Clear employee fields and set office flag
      this.assetForm.patchValue({
        allocatedTo: '',
        allocatedToOffice: 'yes'
      });
      this.filteredEmployees = [];
    } else if (allocateType === 'employee') {
      // Clear office fields and load departments
      this.assetForm.patchValue({
        allocatedToOffice: '',
        location: ''
      });
      this.loadDepartments();
    } else {
      // Clear all allocation fields
      this.assetForm.patchValue({
        allocatedTo: '',
        allocatedToOffice: '',
        location: ''
      });
      this.filteredEmployees = [];
    }
  }

  // ==================== ASSET ACTIVITY LOGS METHODS ====================
 loadAssetActivityLogs(): void {
  this.isLoadingAssetActivityLogs = true;
  
  let params = new HttpParams()
    .set('page', this.currentAssetActivityPage.toString())
    .set('limit', this.assetActivityPageSize.toString())
    .set('group_by', 'employee')
    .set('activity_type', 'asset');// Filter for asset activities only

    if (this.assetActivityFilters.employeeName.trim()) {
      params = params.set('employee_name', this.assetActivityFilters.employeeName.trim());
    }
    
    if (this.assetActivityFilters.employeeId.trim()) {
      params = params.set('employee_id', this.assetActivityFilters.employeeId.trim());
    }
    
    if (this.assetActivityFilters.startDate) {
      params = params.set('start_date', this.assetActivityFilters.startDate);
    }
    
    if (this.assetActivityFilters.endDate) {
      params = params.set('end_date', this.assetActivityFilters.endDate);
    }

    this.http.get<{ success: boolean; data: GroupedActivityLog[]; grouped: boolean }>
    ('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/hr/activity-logs', { params })
    .subscribe({
      next: (response) => {
        if (response.success) {
          // Less restrictive filtering - just check for asset-related activities
          const filteredData = response.data.map(group => ({
            ...group,
            activities: group.activities.filter(activity => 
              // Include activities that have asset_id OR are asset-related action types
              (activity.asset_id || 
               ['asset_allocated', 'asset_returned', 'asset_updated', 'asset_created'].includes(activity.action_type)) &&
              // Exclude ticket-only activities
              !activity.ticket_id
            )
          })).filter(group => group.activities.length > 0);

          this.groupedAssetActivityLogs = filteredData;
        } else {
          this.groupedAssetActivityLogs = [];
        }
        this.isLoadingAssetActivityLogs = false;
      },
      error: (error) => {
        console.error('Error loading asset activity logs:', error);
        this.groupedAssetActivityLogs = [];
        this.isLoadingAssetActivityLogs = false;
      }
    });
  }

  onAssetActivityFilterChange(): void {
    this.currentAssetActivityPage = 1;
    setTimeout(() => {
      this.loadAssetActivityLogs();
    }, 300);
  }

  clearAssetActivityFilters(): void {
    this.assetActivityFilters = {
      employeeName: '',
      employeeId: '',
      startDate: '',
      endDate: ''
    };
    this.currentAssetActivityPage = 1;
    this.loadAssetActivityLogs();
  }

  loadNextAssetActivityPage(): void {
    if (this.currentAssetActivityPage < this.totalAssetActivityPages) {
      this.currentAssetActivityPage++;
      this.loadAssetActivityLogs();
    }
  }

  loadPreviousAssetActivityPage(): void {
    if (this.currentAssetActivityPage > 1) {
      this.currentAssetActivityPage--;
      this.loadAssetActivityLogs();
    }
  }

  // ==================== TICKET ACTIVITY LOGS METHODS ====================
  loadTicketActivityLogs(): void {
    this.isLoadingTicketActivityLogs = true;
    
    let params = new HttpParams()
      .set('page', this.currentTicketActivityPage.toString())
      .set('limit', this.ticketActivityPageSize.toString())
      .set('group_by', 'employee')
      .set('activity_type', 'ticket'); // Filter for ticket activities only

    if (this.ticketActivityFilters.employeeName.trim()) {
      params = params.set('employee_name', this.ticketActivityFilters.employeeName.trim());
    }
    
    if (this.ticketActivityFilters.employeeId.trim()) {
      params = params.set('employee_id', this.ticketActivityFilters.employeeId.trim());
    }
    
    if (this.ticketActivityFilters.startDate) {
      params = params.set('start_date', this.ticketActivityFilters.startDate);
    }
    
    if (this.ticketActivityFilters.endDate) {
      params = params.set('end_date', this.ticketActivityFilters.endDate);
    }

    this.http.get<{ success: boolean; data: GroupedActivityLog[]; grouped: boolean }>
      ('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/hr/activity-logs', { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Filter activities to only include ticket-related ones
            const filteredData = response.data.map(group => ({
              ...group,
              activities: group.activities.filter(activity => 
                activity.ticket_id && 
                ['ticket_created', 'ticket_updated', 'ticket_responded', 'hr_response', 'ticket_closed', 'evidence_uploaded'].includes(activity.action_type)
              )
            })).filter(group => group.activities.length > 0);

            this.groupedTicketActivityLogs = filteredData;
          } else {
            this.groupedTicketActivityLogs = [];
          }
          this.isLoadingTicketActivityLogs = false;
        },
        error: (error) => {
          console.error('Error loading ticket activity logs:', error);
          this.groupedTicketActivityLogs = [];
          this.isLoadingTicketActivityLogs = false;
        }
      });
  }

  onTicketActivityFilterChange(): void {
    this.currentTicketActivityPage = 1;
    setTimeout(() => {
      this.loadTicketActivityLogs();
    }, 300);
  }

  clearTicketActivityFilters(): void {
    this.ticketActivityFilters = {
      employeeName: '',
      employeeId: '',
      startDate: '',
      endDate: ''
    };
    this.currentTicketActivityPage = 1;
    this.loadTicketActivityLogs();
  }

  loadNextTicketActivityPage(): void {
    if (this.currentTicketActivityPage < this.totalTicketActivityPages) {
      this.currentTicketActivityPage++;
      this.loadTicketActivityLogs();
    }
  }

  loadPreviousTicketActivityPage(): void {
    if (this.currentTicketActivityPage > 1) {
      this.currentTicketActivityPage--;
      this.loadTicketActivityLogs();
    }
  }

  getEmployeeInitials(name: string | undefined): string {
    if (!name) return 'N/A';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getActionTypeColorClass(actionType: string): string {
    const colorMap: { [key: string]: string } = {
      'asset_allocated': 'bg-green-100 text-green-600',
      'asset_returned': 'bg-yellow-100 text-yellow-600',
      'asset_updated': 'bg-orange-100 text-orange-600',
      'asset_created': 'bg-blue-100 text-blue-600',
      'ticket_created': 'bg-blue-100 text-blue-600',
      'ticket_updated': 'bg-indigo-100 text-indigo-600',
      'ticket_responded': 'bg-purple-100 text-purple-600',
      'hr_response': 'bg-purple-100 text-purple-600',
      'ticket_closed': 'bg-gray-100 text-gray-600',
      'evidence_uploaded': 'bg-cyan-100 text-cyan-600'
    };
    
    return colorMap[actionType] || 'bg-gray-100 text-gray-600';
  }

  // ==================== TICKET MANAGEMENT FUNCTIONS ====================
  loadTickets(status: string = 'all'): void {
    this.isLoadingTickets = true;
    this.currentTicketFilter = status;
    
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    this.http.get<{ success: boolean; data: Ticket[] }>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/hr/tickets', { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tickets = response.data.map(ticket => ({
              ...ticket,
              evidence: ticket.evidence?.map(e => ({
                type: e.file_type === 'video' ? 'video' : 'image',
                url: `https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/uploads/${e.file_path}`,
                file_path: e.file_path,
                file_type: e.file_type
              })) || []
            }));
            this.ticketDataSource.data = this.tickets;
          } else {
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

  loadTicketStatistics(): void {
    this.http.get<{ success: boolean; data: any }>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/hr/ticket-stats')
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

  openTicketAction(ticket: Ticket): void {
    this.selectedTicket = { ...ticket };
    this.ticketResponse = ticket.resolution_notes || '';
  }

  submitTicketAction(): void {
    if (!this.selectedTicket) return;

    const updateData: any = {};
    
    if (this.selectedTicket.status) {
      updateData.status = this.selectedTicket.status;
    }
    
    if (this.ticketResponse && this.ticketResponse.trim()) {
      updateData.hrResponse = this.ticketResponse.trim();
    }

    if (Object.keys(updateData).length === 0) {
      alert('Please provide a response or update the status.');
      return;
    }

    this.http.put(`https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/hr/tickets/${this.selectedTicket.ticket_id}`, updateData)
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
            
            alert('Ticket updated successfully!');
            this.selectedTicket = null;
            this.ticketResponse = '';

            // Refresh ticket activity logs
            if (this.activeSection === 'ticket-logs') {
              setTimeout(() => {
                this.loadTicketActivityLogs();
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

  openEvidenceModal(evidence: Evidence): void {
    this.selectedEvidence = evidence;
  }

  getEvidenceUrl(filePath: string): string {
    return `https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/uploads/${filePath}`;
  }

  // ==================== ENHANCED ASSET MANAGEMENT FUNCTIONS ====================
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
      allocatedToOffice: apiAsset.allocated_to_office,
      location: apiAsset.location,
      vendor: apiAsset.vendor,
      vendorEmail: apiAsset.vendor_email,
      vendorContact: apiAsset.vendor_contact,
      warrantyExpiry: apiAsset.warranty_expiry,
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
    
    this.http.get<any>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/assets')
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
        allocatedTo: 'K0021', 
        allocatedToOffice: '',
        location: '',
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
        status: 'Allocated', 
        allocatedTo: '', 
        allocatedToOffice: 'yes',
        location: '2nd Floor',
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
    this.http.get<{ success: boolean; data: any[] }>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/vendors')
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

  loadDepartments(): void {
    this.http.get<any>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/departments')
      .subscribe({
        next: (resp) => {
          if (resp?.success && Array.isArray(resp.data)) {
            this.departmentOptions = resp.data;
          } else {
            this.departmentOptions = [];
          }
        },
        error: (error) => {
          console.error('Error loading departments:', error);
          this.departmentOptions = [];
        }
      });
  }

  onDepartmentChange(event: any): void {
    const departmentId = event.target.value;
    this.filteredEmployees = [];
    
    if (!departmentId) {
      this.assetForm.get('allocatedTo')?.setValue('');
      return;
    }
    
    const currentAssetId = this.assetForm.get('assetId')?.value;
    
    this.http.get<any>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/employees/by-group', {
      params: new HttpParams().set('grp_id', departmentId)
    }).subscribe({
      next: (resp) => {
        if (resp?.success && Array.isArray(resp.data)) {
          this.filteredEmployees = resp.data;
        } else {
          this.filteredEmployees = [];
        }
        
        this.assetForm.get('allocatedTo')?.setValue('');
        
        if (currentAssetId) {
          this.assetForm.get('assetId')?.setValue(currentAssetId);
        }
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.filteredEmployees = [];
        this.assetForm.get('allocatedTo')?.setValue('');
        
        if (currentAssetId) {
          this.assetForm.get('assetId')?.setValue(currentAssetId);
        }
      }
    });
  }

  onEmployeeChange(event: any): void {
    const employeeId = event.target.value;
    const currentAssetId = this.assetForm.get('assetId')?.value;
    
    this.assetForm.get('allocatedTo')?.setValue(employeeId);
    
    if (currentAssetId) {
      this.assetForm.get('assetId')?.setValue(currentAssetId);
    }
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
    this.showAssetModal = true;

    this.http.get<any>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/assets/next-id')
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
  }

  editAsset(asset: Asset): void {
    this.editingAsset = asset;
    
    // Determine allocate type based on current allocation
    let allocateType = '';
    if (asset.status === 'Allocated') {
      if (asset.allocatedTo) {
        allocateType = 'employee';
      } else if (asset.allocatedToOffice) {
        allocateType = 'office';
      }
    }
    
    this.assetForm.patchValue({
      assetId: asset.assetId,
      serialNumber: asset.serialNumber,
      name: asset.name,
      type: asset.type,
      brand: asset.brand,
      model: asset.model,
      status: asset.status,
      allocateTo: allocateType,
      allocatedTo: asset.allocatedTo || '',
      allocatedToOffice: asset.allocatedToOffice || '',
      location: asset.location || '',
      vendor: asset.vendor,
      vendorEmail: asset.vendorEmail,
      vendorContact: asset.vendorContact,
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      reason: asset.reason || ''
    });
    
    // Load departments and employees if needed
    if (asset.status === 'Allocated' && asset.allocatedTo) {
      this.loadDepartments();
    }
    
    this.filteredEmployees = [];
    this.showAssetModal = true;
  }

  closeAddAssetModal(): void {
    this.showAssetModal = false;
    this.editingAsset = null;
    this.assetForm.reset();
    this.filteredEmployees = [];
  }

  onAssetSubmit(): void {
    if (!this.assetForm.valid) {
      Object.keys(this.assetForm.controls).forEach(key => {
        this.assetForm.get(key)?.markAsTouched();
      });
      alert('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.assetForm.value;
    
    // Validation for status-specific requirements
    if ((formValue.status === 'Maintenance' || formValue.status === 'Retired') && !formValue.reason?.trim()) {
      alert('Please provide a reason for Maintenance or Retired status.');
      return;
    }

    if (formValue.status === 'Allocated') {
      if (!formValue.allocateTo) {
        alert('Please select allocation type (Office or Employee).');
        return;
      }
      
      if (formValue.allocateTo === 'office' && !formValue.location) {
        alert('Please select a location for office allocation.');
        return;
      }
      
      if (formValue.allocateTo === 'employee' && !formValue.allocatedTo) {
        alert('Please select an employee for allocation.');
        return;
      }
    }

    const apiPayload: any = {
      serial_number: formValue.serialNumber,
      name: formValue.name,
      type: formValue.type,
      brand: formValue.brand,
      model: formValue.model,
      status: formValue.status,
      vendor: formValue.vendor,
      vendor_email: formValue.vendorEmail,
      vendor_contact: formValue.vendorContact,
      warranty_expiry: formValue.warrantyExpiry || null
    };

    // Handle allocation based on type
    if (formValue.status === 'Allocated') {
      if (formValue.allocateTo === 'employee') {
        apiPayload.allocated_to = formValue.allocatedTo;
        apiPayload.allocated_to_office = null;
        apiPayload.location = null;
      } else if (formValue.allocateTo === 'office') {
        apiPayload.allocated_to = null;
        apiPayload.allocated_to_office = 'yes';
        apiPayload.location = formValue.location;
      }
    } else if (formValue.status === 'Retired') {
      // Clear all allocation for retired assets
      apiPayload.allocated_to = null;
      apiPayload.allocated_to_office = null;
      apiPayload.location = null;
    } else if (formValue.status === 'Available') {
      // Clear all allocation for available assets
      apiPayload.allocated_to = null;
      apiPayload.allocated_to_office = null;
      apiPayload.location = null;
    } else {
      // Maintenance - keep existing allocation
      apiPayload.allocated_to = formValue.allocatedTo || null;
      apiPayload.allocated_to_office = formValue.allocatedToOffice || null;
      apiPayload.location = formValue.location || null;
    }

    // Add reason for Maintenance/Retired
    if ((formValue.status === 'Maintenance' || formValue.status === 'Retired') && formValue.reason?.trim()) {
      apiPayload.reason = formValue.reason.trim();
    }

    // Clean up empty strings
    Object.keys(apiPayload).forEach(key => {
      if (apiPayload[key] === '') {
        apiPayload[key] = null;
      }
    });

    if (this.editingAsset) {
      const assetId = this.editingAsset.assetId;
      const url = `https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/assets/${assetId}`;
      
      this.http.put(url, apiPayload).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadAssets();
            this.closeAddAssetModal();
            alert('Asset updated successfully!');
            
            // Refresh asset activity logs
            if (this.activeSection === 'asset-logs') {
              setTimeout(() => {
                this.loadAssetActivityLogs();
              }, 1000);
            }
          } else {
            alert(`Failed to update asset: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('Update error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
          alert(`Error updating asset: ${errorMessage}`);
        }
      });
    } else {
      const url = 'https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/assets';
      
      this.http.post(url, apiPayload).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadAssets();
            this.closeAddAssetModal();
            alert('Asset added successfully!');
            
            // Refresh asset activity logs
            if (this.activeSection === 'asset-logs') {
              setTimeout(() => {
                this.loadAssetActivityLogs();
              }, 1000);
            }
          } else {
            alert('Failed to add asset. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error creating asset:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
          alert(`Error creating asset: ${errorMessage}`);
        }
      });
    }
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`Are you sure you want to delete asset ${asset.serialNumber}?`)) {
      this.http.delete(`https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/assets/${asset.assetId || asset.serialNumber}`)
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
        this.http.put(`https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/vendors/${this.editingVendor.id}`, apiPayload)
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
        this.http.post('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/vendors', apiPayload)
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
      this.http.delete(`https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/vendors/${vendor.id}`)
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

  // ==================== HELPER FUNCTIONS ====================
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}