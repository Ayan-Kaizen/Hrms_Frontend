import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-current-profile',
  templateUrl: './current-profile.component.html',
  styleUrls: ['./current-profile.component.css']
})
export class CurrentProfileComponent implements OnInit {
  email: string | null = null;
  profile: any = null;
  isLoading: boolean = true;
  error: string | null = null;
  availableDocuments: any[] = []; // Stores documents that actually exist and are verified on backend

  // Properties for download progress overlay
  downloadProgress = {
    show: false,
    current: 0,
    total: 0,
    message: ''
  };

  constructor( private http: HttpClient, private route: ActivatedRoute, private authService: AuthService,
  private router: Router) {}

  logout(): void {
    this.authService.logout();  // Clear user data from AuthService and localStorage
    this.router.navigate(['/login']);  // Navigate to login page
  }



  ngOnInit(): void {
    this.email = this.route.snapshot.paramMap.get('email');
    if (this.email) {
      this.fetchProfile(this.email);
    } else {
      this.error = 'No email parameter provided';
      this.isLoading = false;
    }
  }

  /**
   * Fetches the employee profile from the backend.
   * After fetching, it filters and verifies the existence of documents.
   */
  fetchProfile(email: string): void {
    this.isLoading = true;
    this.error = null;

    this.http.get(`http://localhost:3000/api/employee-profiles/email/${email}`)
      .subscribe({
        next: async (res: any) => {
          console.log('API response:', res);
          if (res.success) {
            this.profile = res.data;

            // Filter and verify documents that actually exist on the server
            if (this.profile.documents && Array.isArray(this.profile.documents)) {
              await this.filterExistingDocuments(this.profile.documents);
            } else {
              this.availableDocuments = []; // No documents or invalid format
            }

            console.log('Available Documents for display and download:', this.availableDocuments);
            this.isLoading = false;
          } else {
            this.error = res.message || 'Failed to fetch profile';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error fetching profile:', err);
          this.error = 'Error fetching profile data';
          this.isLoading = false;
        }
      });
  }

  /**
   * Iterates through the raw list of documents from the profile.
   * For each document, it performs a HEAD request to the server to check
   * if the file physically exists before adding it to `availableDocuments`.
   * This ensures only truly uploaded documents are displayed and downloaded.
   */
  async filterExistingDocuments(documents: any[]): Promise<void> {
    this.availableDocuments = []; // Clear previous list before populating

    for (const doc of documents) {
      // Basic validation: ensure document object and path/type exist
      if (doc && doc.documentPath && doc.documentPath.trim() !== '' &&
          doc.documentType && doc.documentType.trim() !== '') {

        const fileUrl = `http://localhost:3000/uploads/${doc.documentPath}`;
        try {
          // Use HEAD request to check existence without downloading the full file content
          // 'no-store' cache prevents browser from using stale cached responses
          const response = await fetch(fileUrl, { method: 'HEAD', cache: 'no-store' });

          if (response.ok) {
            // File exists on the server, add it to the list of available documents
            this.availableDocuments.push({
              ...doc, // Keep all original document properties
              fileUrl: fileUrl, // Store the full URL for easy access
              // Construct a user-friendly filename for download, including original extension
              fileName: `${doc.documentType}${this.getFileExtension(doc.documentPath)}`,
              fileSize: response.headers.get('content-length') || 'Unknown' // Get file size if available
            });
          } else {
            // Log if a document from the database isn't found on the server
            console.warn(`Document not found or inaccessible on server: ${doc.documentPath} (Status: ${response.status})`);
          }
        } catch (error) {
          // Log any network or fetch errors during the existence check
          console.warn(`Error checking document existence for: ${doc.documentPath}`, error);
        }
      }
    }
  }

  /**
   * Extracts the file extension from a given file path.
   * @param filePath The full path of the document (e.g., 'invoice.pdf').
   * @returns The file extension including the dot (e.g., '.pdf'), or empty string if no extension.
   */
  private getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  /**
   * Calculates the time elapsed since a given date of joining (DOJ).
   * @param doj The date of joining string.
   * @returns A human-readable string (e.g., "2 years, 3 months and 15 days").
   */
  getDaysSinceJoining(doj: string): string {
    if (!doj) return 'N/A';

    const joinDate = new Date(doj);
    const currentDate = new Date();

    let years = currentDate.getFullYear() - joinDate.getFullYear();
    let months = currentDate.getMonth() - joinDate.getMonth();
    let days = currentDate.getDate() - joinDate.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} year${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
      parts.push(`${months} month${months > 1 ? 's' : ''}`);
    }
    if (days > 0) {
      parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return 'Today';
    } else if (parts.length === 1) {
      return parts[0];
    } else if (parts.length === 2) {
      return parts.join(' and ');
    } else {
      return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
    }
  }

  // --- Download Functionality ---

  /**
   * Initiates the download of all available documents.
   * Displays a confirmation and a progress bar.
   */
  async downloadAllDocuments(): Promise<void> {
    if (!this.hasValidDocuments()) {
      alert('No documents available for download.');
      return;
    }

    const proceed = confirm(
      `This will download ${this.availableDocuments.length} document(s). Continue?`
    );

    if (!proceed) return;

    this.showDownloadProgress(); // Show the progress overlay

    let downloadCount = 0;
    let errorCount = 0;
    const totalDocuments = this.availableDocuments.length;

    for (let i = 0; i < this.availableDocuments.length; i++) {
      const doc = this.availableDocuments[i];

      // Introduce a small delay to avoid browser blocking multiple simultaneous downloads
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 800));

      try {
        await this.downloadDocument(doc); // Await each individual download
        downloadCount++;
        this.updateProgress(downloadCount + errorCount, totalDocuments);
      } catch (error) {
        console.error(`Error downloading ${doc.documentType} (${doc.documentPath}):`, error);
        errorCount++;
        this.updateProgress(downloadCount + errorCount, totalDocuments);
      }
    }

    // Hide progress and show final summary after all attempts
    setTimeout(() => {
      this.hideDownloadProgress();
      if (errorCount === 0) {
        alert(`Successfully downloaded all ${downloadCount} document(s)!`);
      } else if (downloadCount > 0) {
        alert(`Downloaded ${downloadCount} document(s). ${errorCount} failed to download.`);
      } else {
        alert('Failed to download documents. Please check the console for errors.');
      }
    }, 1000); // Small delay before final alert
  }

  /**
   * Initiates the download of a single document.
   * @param doc The document object to be downloaded.
   */
  async downloadSingleDocument(doc: any): Promise<void> {
    if (!doc || !doc.fileUrl) {
      alert('Document not available for download.');
      return;
    }
    try {
      await this.downloadDocument(doc);
      setTimeout(() => {
        alert(`${doc.documentType} downloaded successfully!`);
      }, 500); // Small delay for user feedback
    } catch (error) {
      console.error('Error downloading single document:', error);
      alert('Error downloading document. Please try again.');
    }
  }

  /**
   * Core function to force the download of a file using Fetch API and Blob.
   * This is crucial for files that browsers might otherwise open in a new tab (like PDFs, images).
   * @param doc The document object containing `fileUrl` and `fileName`.
   */
  private async downloadDocument(doc: any): Promise<void> {
    try {
      const response = await fetch(doc.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${doc.fileUrl}: HTTP status ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob(); // Get file content as a Blob
      const url = window.URL.createObjectURL(blob); // Create a temporary URL for the Blob

      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName; // THIS IS THE KEY: tells the browser to download and suggests filename
      document.body.appendChild(a); // Append to DOM to make it clickable
      a.click(); // Programmatically click the link to trigger download
      
      window.URL.revokeObjectURL(url); // Clean up the temporary URL to free memory
      document.body.removeChild(a); // Remove the temporary link from DOM
    } catch (error) {
      console.error(`Download failed for ${doc.fileName}:`, error);
      throw error; // Re-throw to be handled by calling functions (downloadAllDocuments, downloadSingleDocument)
    }
  }

  // --- Download Progress UI Management ---

  /**
   * Creates and displays a simple overlay for download progress.
   */
  private showDownloadProgress(): void {
    let progressDiv = document.getElementById('downloadProgress');
    if (!progressDiv) { // Create the div only if it doesn't already exist
      progressDiv = document.createElement('div');
      progressDiv.id = 'downloadProgress';
      progressDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                      background: white; padding: 30px; border: 1px solid #ddd; border-radius: 8px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 10000; min-width: 300px; text-align: center;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Downloading Documents</h4>
          <p id="progressText" style="margin: 10px 0; color: #666;">Preparing downloads...</p>
          <div style="width: 100%; height: 12px; background: #f0f0f0; border-radius: 6px; overflow: hidden;">
            <div id="progressBar" style="width: 0%; height: 100%; background: #007bff; border-radius: 6px; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #888;">Please wait while files are being downloaded...</p>
        </div>
      `;
      document.body.appendChild(progressDiv);
    }
  }

  /**
   * Updates the text and visual progress bar of the download overlay.
   * @param current The number of documents processed so far.
   * @param total The total number of documents to download.
   */
  private updateProgress(current: number, total: number): void {
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');

    if (progressText) {
      progressText.textContent = `Downloaded ${current} of ${total} documents`;
    }

    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * Hides and removes the download progress overlay from the DOM.
   */
  private hideDownloadProgress(): void {
    const progressDiv = document.getElementById('downloadProgress');
    if (progressDiv) {
      document.body.removeChild(progressDiv);
    }
  }

  // --- General Utility Functions (used in HTML for display logic) ---

  /**
   * Checks if there are any valid documents available for display/download.
   */
  hasValidDocuments(): boolean {
    return this.availableDocuments && this.availableDocuments.length > 0;
  }

  /**
   * Returns the count of available documents.
   */
  getDocumentCount(): number {
    return this.availableDocuments ? this.availableDocuments.length : 0;
  }

  /**
   * Checks if a specific document type exists in the available documents.
   * @param documentType The type of document to check (e.g., 'Resume').
   */
  hasDocumentType(documentType: string): boolean {
    if (!this.hasValidDocuments()) return false;

    return this.availableDocuments.some((doc: any) =>
      doc.documentType &&
      doc.documentType.toLowerCase().includes(documentType.toLowerCase())
    );
  }

  /**
   * Retrieves all available documents of a specific type.
   * @param documentType The type of document to filter by.
   */
  getDocumentsByType(documentType: string): any[] {
    if (!this.hasValidDocuments()) return [];

    return this.availableDocuments.filter((doc: any) =>
      doc.documentType &&
      doc.documentType.toLowerCase().includes(documentType.toLowerCase())
    );
  }

  /**
   * Determines the appropriate icon class based on file extension.
   * (Note: This returns a string, you'd typically use it in an `ngClass` or direct string interpolation
   * with a mapping to actual SVG/font-awesome icons.)
   * @param documentPath The path of the document.
   */
  getFileIcon(documentPath: string): string {
    if (!documentPath) return 'default';

    const extension = documentPath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'txt':
        return 'text';
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      default:
        return 'default';
    }
  }

  /**
   * Formats file size in bytes into a human-readable format (e.g., "1.2 MB").
   * @param bytes The file size in bytes (as string or number).
   */
  formatFileSize(bytes: string | number): string {
    if (!bytes || bytes === 'Unknown') return 'Unknown size';

    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size)) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Formats a date string into a localized short date format (e.g., "MM/DD/YY").
   * @param date The date string.
   */
  formatDate(date: string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  /**
   * Generates initials from a name for a profile image fallback.
   * @param name The full name.
   */
  getInitials(name: string): string {
    if (!name) return 'E';
    return name.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Triggers a refresh of the profile data.
   */
  refreshProfile(): void {
    if (this.email) {
      this.fetchProfile(this.email);
    }
  }

  /**
   * Checks if a specific document type has been uploaded and is available.
   * @param documentType The type of document to check.
   */
  isDocumentUploaded(documentType: string): boolean {
    return this.hasDocumentType(documentType);
  }

  /**
   * Gets the first document object for a given document type, if available.
   * @param documentType The type of document to retrieve.
   */
  getDocumentInfo(documentType: string): any {
    const docs = this.getDocumentsByType(documentType);
    return docs.length > 0 ? docs[0] : null;
  }

  /**
   * Opens a document in a new browser tab for preview.
   * This does NOT force a download.
   * @param doc The document object with `fileUrl`.
   */
  previewDocument(doc: any): void {
    if (!doc || !doc.fileUrl) {
      alert('Document not available for preview');
      return;
    }
    // Directly open the URL. Browser determines if it can display or if it downloads.
    window.open(doc.fileUrl, '_blank');
  }
}