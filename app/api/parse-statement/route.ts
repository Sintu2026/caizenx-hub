import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

interface StatementSummary {
  cardNumber: string;
  statementDate: string;
  dueDate: string;
  previousBalance: number;
  totalPayments: number;
  totalPurchases: number;
  totalFees: number;
  totalInterest: number;
  newBalance: number;
  minimumPayment: number;
  creditLimit: number;
  availableCredit: number;
}

function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  if (/grocery|supermarket|walmart|costco|loblaws|no frills|metro|sobeys|freshco|food basics/i.test(desc)) return 'Groceries';
  if (/restaurant|mcdonald|tim horton|starbucks|subway|pizza|burger|cafe|coffee|doordash|uber eats|skip the dishes/i.test(desc)) return 'Dining';
  if (/gas|shell|petro|esso|pioneer|fuel|canadian tire gas/i.test(desc)) return 'Gas & Fuel';
  if (/amazon|ebay|online|shopify|etsy/i.test(desc)) return 'Online Shopping';
  if (/netflix|spotify|disney|apple|google play|subscription|membership/i.test(desc)) return 'Subscriptions';
  if (/hydro|enbridge|gas bill|water|electric|utility|rogers|bell|telus|fido|internet|phone/i.test(desc)) return 'Utilities & Telecom';
  if (/insurance|manulife|sunlife|great-west/i.test(desc)) return 'Insurance';
  if (/doctor|pharmacy|shoppers drug|dental|medical|health/i.test(desc)) return 'Health & Medical';
  if (/canadian tire|home depot|lowes|rona|home hardware/i.test(desc)) return 'Home Improvement';
  if (/travel|hotel|airbnb|airline|air canada|westjet|booking/i.test(desc)) return 'Travel';
  if (/interest|finance charge/i.test(desc)) return 'Interest & Fees';
  if (/fee|annual fee|late fee|charge/i.test(desc)) return 'Fees';
  if (/payment|thank you/i.test(desc)) return 'Payment';
  if (/transfer|e-transfer/i.test(desc)) return 'Transfer';
  return 'Other';
}

function parseTransactions(text: string): { transactions: Transaction[]; summary: Partial<StatementSummary> } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const transactions: Transaction[] = [];
  const summary: Partial<StatementSummary> = {};

  // Common date patterns: MM/DD/YYYY, MM/DD/YY, MMM DD YYYY, DD/MM/YYYY, YYYY-MM-DD
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\w{3}\s+\d{1,2},?\s*\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
  ];

  // Amount pattern: optional minus, optional $, digits with optional commas, decimal, cents
  const amountPattern = /(-?\$?\s*[\d,]+\.\d{2})/;

  // Extract summary info
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('previous balance') || lowerLine.includes('previous statement')) {
      const match = line.match(amountPattern);
      if (match) summary.previousBalance = parseAmount(match[1]);
    }
    if (lowerLine.includes('new balance') || lowerLine.includes('statement balance')) {
      const match = line.match(amountPattern);
      if (match) summary.newBalance = parseAmount(match[1]);
    }
    if (lowerLine.includes('minimum payment')) {
      const match = line.match(amountPattern);
      if (match) summary.minimumPayment = parseAmount(match[1]);
    }
    if (lowerLine.includes('credit limit')) {
      const match = line.match(amountPattern);
      if (match) summary.creditLimit = parseAmount(match[1]);
    }
    if (lowerLine.includes('payment due') || lowerLine.includes('due date')) {
      for (const dp of datePatterns) {
        const match = line.match(dp);
        if (match) { summary.dueDate = match[1]; break; }
      }
    }
    if (lowerLine.includes('statement date') || lowerLine.includes('closing date')) {
      for (const dp of datePatterns) {
        const match = line.match(dp);
        if (match) { summary.statementDate = match[1]; break; }
      }
    }
    if (/card\s*(number|ending|#).*(\d{4})/i.test(line)) {
      const match = line.match(/(\d{4})\s*$/);
      if (match) summary.cardNumber = `****${match[1]}`;
    }
  }

  // Parse transaction lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try each date pattern
    for (const dp of datePatterns) {
      const dateMatch = line.match(dp);
      if (!dateMatch) continue;

      const amountMatch = line.match(amountPattern);
      if (!amountMatch) continue;

      const date = dateMatch[1];
      const amount = parseAmount(amountMatch[1]);

      // Extract description: text between date and amount
      const dateEnd = line.indexOf(dateMatch[1]) + dateMatch[1].length;
      const amountStart = line.lastIndexOf(amountMatch[1]);
      let description = line.substring(dateEnd, amountStart).trim();

      // Sometimes there's a second date (posting date) - remove it
      for (const dp2 of datePatterns) {
        description = description.replace(dp2, '').trim();
      }

      // Clean up description
      description = description.replace(/\s+/g, ' ').trim();
      if (!description || description.length < 2) continue;

      // Determine if debit or credit
      const isCredit = amount < 0 || /\bcr\b|credit|payment/i.test(line);

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type: isCredit ? 'credit' : 'debit',
        category: categorizeTransaction(description),
      });

      break; // Found a match, move to next line
    }
  }

  // Calculate summary totals from transactions
  if (transactions.length > 0) {
    summary.totalPayments = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    summary.totalPurchases = transactions
      .filter(t => t.type === 'debit' && t.category !== 'Interest & Fees' && t.category !== 'Fees')
      .reduce((sum, t) => sum + t.amount, 0);
    summary.totalFees = transactions
      .filter(t => t.category === 'Fees')
      .reduce((sum, t) => sum + t.amount, 0);
    summary.totalInterest = transactions
      .filter(t => t.category === 'Interest & Fees')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  return { transactions, summary };
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

async function generateExcel(transactions: Transaction[], summary: Partial<StatementSummary>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Caizenx Hub';
  workbook.created = new Date();

  // --- Sheet 1: Transactions ---
  const txSheet = workbook.addWorksheet('Transactions', {
    properties: { tabColor: { argb: '3B82F6' } },
  });

  // Title row
  txSheet.mergeCells('A1:F1');
  const titleCell = txSheet.getCell('A1');
  titleCell.value = 'Credit Card Statement - Transactions';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  txSheet.getRow(1).height = 35;

  // Headers
  const headers = ['Date', 'Description', 'Category', 'Type', 'Debit ($)', 'Credit ($)'];
  const headerRow = txSheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: '1E40AF' } },
    };
  });
  headerRow.height = 25;

  // Data rows
  transactions.forEach((tx, idx) => {
    const row = txSheet.addRow([
      tx.date,
      tx.description,
      tx.category,
      tx.type === 'debit' ? 'Debit' : 'Credit',
      tx.type === 'debit' ? tx.amount : '',
      tx.type === 'credit' ? tx.amount : '',
    ]);

    const bgColor = idx % 2 === 0 ? 'F8FAFC' : 'EFF6FF';
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
      if (colNumber === 5 || colNumber === 6) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
      if (colNumber === 4) {
        cell.font = {
          color: { argb: tx.type === 'debit' ? 'DC2626' : '16A34A' },
          bold: true,
        };
      }
    });
  });

  // Totals row
  const lastDataRow = transactions.length + 2; // +1 for title, +1 for header
  const totalsRow = txSheet.addRow([
    '', 'TOTALS', '', '',
    { formula: `SUM(E3:E${lastDataRow})` },
    { formula: `SUM(F3:F${lastDataRow})` },
  ]);
  totalsRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
    cell.border = { top: { style: 'double', color: { argb: '1E40AF' } } };
  });
  totalsRow.getCell(5).numFmt = '#,##0.00';
  totalsRow.getCell(6).numFmt = '#,##0.00';

  // Column widths
  txSheet.getColumn(1).width = 14;
  txSheet.getColumn(2).width = 40;
  txSheet.getColumn(3).width = 20;
  txSheet.getColumn(4).width = 10;
  txSheet.getColumn(5).width = 14;
  txSheet.getColumn(6).width = 14;

  // --- Sheet 2: Summary ---
  const sumSheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: '8B5CF6' } },
  });

  sumSheet.mergeCells('A1:B1');
  const sumTitle = sumSheet.getCell('A1');
  sumTitle.value = 'Statement Summary';
  sumTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
  sumTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  sumSheet.getRow(1).height = 35;

  const summaryData: [string, string | number][] = [
    ['Card Number', summary.cardNumber || 'N/A'],
    ['Statement Date', summary.statementDate || 'N/A'],
    ['Payment Due Date', summary.dueDate || 'N/A'],
    ['Previous Balance', summary.previousBalance ?? 'N/A'],
    ['Total Payments/Credits', summary.totalPayments ?? 0],
    ['Total Purchases', summary.totalPurchases ?? 0],
    ['Total Fees', summary.totalFees ?? 0],
    ['Total Interest', summary.totalInterest ?? 0],
    ['New Balance', summary.newBalance ?? 'N/A'],
    ['Minimum Payment', summary.minimumPayment ?? 'N/A'],
    ['Credit Limit', summary.creditLimit ?? 'N/A'],
    ['Total Transactions', transactions.length],
  ];

  summaryData.forEach(([label, value], idx) => {
    const row = sumSheet.addRow([label, value]);
    const bgColor = idx % 2 === 0 ? 'F8FAFC' : 'EFF6FF';
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    if (typeof value === 'number') {
      row.getCell(2).numFmt = '#,##0.00';
    }
    row.eachCell((cell) => {
      cell.border = { bottom: { style: 'thin', color: { argb: 'E2E8F0' } } };
    });
  });

  sumSheet.getColumn(1).width = 25;
  sumSheet.getColumn(2).width = 20;

  // --- Sheet 3: Category Breakdown ---
  const catSheet = workbook.addWorksheet('By Category', {
    properties: { tabColor: { argb: 'F59E0B' } },
  });

  catSheet.mergeCells('A1:C1');
  const catTitle = catSheet.getCell('A1');
  catTitle.value = 'Spending by Category';
  catTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  catTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
  catTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  catSheet.getRow(1).height = 35;

  const catHeaders = catSheet.addRow(['Category', 'Transaction Count', 'Total Amount ($)']);
  catHeaders.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center' };
  });
  catHeaders.height = 25;

  // Aggregate by category
  const categoryMap = new Map<string, { count: number; total: number }>();
  transactions.forEach(tx => {
    const existing = categoryMap.get(tx.category) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += tx.type === 'debit' ? tx.amount : -tx.amount;
    categoryMap.set(tx.category, existing);
  });

  const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1].total - a[1].total);
  sortedCategories.forEach(([category, data], idx) => {
    const row = catSheet.addRow([category, data.count, data.total]);
    const bgColor = idx % 2 === 0 ? 'F8FAFC' : 'EFF6FF';
    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'E2E8F0' } } };
      if (colNumber === 3) cell.numFmt = '#,##0.00';
      if (colNumber === 2) cell.alignment = { horizontal: 'center' };
    });
  });

  catSheet.getColumn(1).width = 25;
  catSheet.getColumn(2).width = 20;
  catSheet.getColumn(3).width = 20;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = formData.get('action') as string || 'parse';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const data = new Uint8Array(bytes);

    // Parse PDF using PDFParse v2
    const parser = new PDFParse({ data });
    const textResult = await parser.getText();
    const pdfText = textResult.text;
    const totalPages = textResult.total;
    const { transactions, summary } = parseTransactions(pdfText);

    if (action === 'download') {
      // Generate Excel file
      const excelBuffer = await generateExcel(transactions, summary);
      await parser.destroy();

      return new NextResponse(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="credit-card-statement-${Date.now()}.xlsx"`,
        },
      });
    }

    await parser.destroy();

    // Return parsed data for preview
    return NextResponse.json({
      transactions,
      summary,
      rawTextPreview: pdfText.substring(0, 500),
      totalPages,
    });
  } catch (error) {
    console.error('Error processing statement:', error);
    return NextResponse.json(
      { error: 'Failed to process the statement. Please ensure it is a valid credit card statement PDF.' },
      { status: 500 }
    );
  }
}
