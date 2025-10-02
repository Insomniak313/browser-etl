import { ILoader } from '../types';

export interface TableLoaderConfig {
  container: string | HTMLElement;
  headers?: string[];
  sortable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  style?: any;
}

/**
 * Table Loader - loads data into HTML tables
 */
export class TableLoader implements ILoader {
  readonly name = 'table';

  async load(data: any, config: TableLoaderConfig): Promise<void> {
    const {
      container,
      headers,
      sortable = false,
      searchable = false,
      pagination = false,
      pageSize = 10,
      className = 'browser-etl-table',
      style
    } = config;

    if (!container) {
      throw new Error('Container is required for table loading');
    }

    let targetContainer: HTMLElement;

    if (typeof container === 'string') {
      targetContainer = document.querySelector(container) as HTMLElement;
      if (!targetContainer) {
        throw new Error(`Container element '${container}' not found`);
      }
    } else {
      targetContainer = container;
    }

    // Clear existing content
    targetContainer.innerHTML = '';

    // Create table wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `${className}-wrapper`;

    // Add search if enabled
    if (searchable) {
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search...';
      searchInput.className = `${className}-search`;
      searchInput.style.cssText = 'margin-bottom: 10px; padding: 5px; width: 100%;';
      wrapper.appendChild(searchInput);
    }

    // Create table
    const table = document.createElement('table');
    table.className = className;
    if (style) {
      Object.assign(table.style, style);
    } else {
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      `;
    }

    // Prepare data
    const tableData = this.prepareTableData(data);
    const tableHeaders = this.extractHeaders(tableData, headers);

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    tableHeaders.forEach((header, index) => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.cssText = `
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        background-color: #f2f2f2;
        cursor: ${sortable ? 'pointer' : 'default'};
      `;
      
      if (sortable) {
        th.addEventListener('click', () => this.sortTable(table, index));
      }
      
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    this.populateTableBody(tbody, tableData);
    table.appendChild(tbody);

    wrapper.appendChild(table);

    // Add pagination if enabled
    if (pagination && tableData.length > pageSize) {
      const paginationDiv = this.createPagination(tableData.length, pageSize, className);
      wrapper.appendChild(paginationDiv);
    }

    targetContainer.appendChild(wrapper);

    // Add search functionality
    if (searchable) {
      const searchInput = wrapper.querySelector(`.${className}-search`) as HTMLInputElement;
      searchInput.addEventListener('input', (e) => {
        this.filterTable(tbody, (e.target as HTMLInputElement).value);
      });
    }
  }

  supports(config: any): boolean {
    return config && config.container;
  }

  private prepareTableData(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      return [data];
    }

    return [{ value: data }];
  }

  private extractHeaders(data: any[], headers?: string[]): string[] {
    if (headers) {
      return headers;
    }

    if (data.length === 0) {
      return [];
    }

    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      return Object.keys(firstItem);
    }

    return ['Value'];
  }

  private populateTableBody(tbody: HTMLElement, data: any[]): void {
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.style.cssText = `
        background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};
      `;

      if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(value => {
          const cell = document.createElement('td');
          cell.textContent = String(value);
          cell.style.cssText = `
            border: 1px solid #ddd;
            padding: 8px;
          `;
          row.appendChild(cell);
        });
      } else {
        const cell = document.createElement('td');
        cell.textContent = String(item);
        cell.style.cssText = `
          border: 1px solid #ddd;
          padding: 8px;
        `;
        row.appendChild(cell);
      }

      tbody.appendChild(row);
    });
  }

  private sortTable(table: HTMLTableElement, columnIndex: number): void {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const sortedRows = rows.sort((a, b) => {
      const aText = a.children[columnIndex].textContent || '';
      const bText = b.children[columnIndex].textContent || '';
      
      // Try to parse as numbers
      const aNum = parseFloat(aText);
      const bNum = parseFloat(bText);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      return aText.localeCompare(bText);
    });

    // Clear and repopulate tbody
    tbody.innerHTML = '';
    sortedRows.forEach(row => tbody.appendChild(row));
  }

  private filterTable(tbody: HTMLElement, searchTerm: string): void {
    const rows = tbody.querySelectorAll('tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
      const text = row.textContent?.toLowerCase() || '';
      const shouldShow = text.includes(term);
      (row as HTMLElement).style.display = shouldShow ? '' : 'none';
    });
  }

  private createPagination(totalItems: number, pageSize: number, className: string): HTMLElement {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = `${className}-pagination`;
    paginationDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    `;

    const totalPages = Math.ceil(totalItems / pageSize);
    let currentPage = 1;

    const updatePagination = () => {
      paginationDiv.innerHTML = '';

      // Previous button
      const prevButton = document.createElement('button');
      prevButton.textContent = 'Previous';
      prevButton.disabled = currentPage === 1;
      prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updatePagination();
        }
      });
      paginationDiv.appendChild(prevButton);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = String(i);
        pageButton.disabled = i === currentPage;
        pageButton.addEventListener('click', () => {
          currentPage = i;
          updatePagination();
        });
        paginationDiv.appendChild(pageButton);
      }

      // Next button
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.disabled = currentPage === totalPages;
      nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          updatePagination();
        }
      });
      paginationDiv.appendChild(nextButton);
    };

    updatePagination();
    return paginationDiv;
  }
}