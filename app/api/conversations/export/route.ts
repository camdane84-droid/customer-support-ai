import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('business_id');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const channel = searchParams.get('channel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Build query
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        customer_instagram_id,
        channel,
        status,
        unread_count,
        created_at,
        last_message_at,
        notes
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (!includeArchived) {
      query = query.neq('status', 'archived');
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: conversations, error: conversationsError } = await query;

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({
        error: 'Failed to fetch conversations',
        details: conversationsError.message,
        code: conversationsError.code
      }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      // Return empty CSV with headers if no conversations
      const headers = [
        'ID',
        'Customer Name',
        'Email',
        'Phone',
        'Instagram ID',
        'Channel',
        'Status',
        'Unread Count',
        'Created At',
        'Last Message At',
        'Notes'
      ];

      const csvContent = headers.join(',');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `conversations-export-${timestamp}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Generate CSV content
    const headers = [
      'ID',
      'Customer Name',
      'Email',
      'Phone',
      'Instagram ID',
      'Channel',
      'Status',
      'Unread Count',
      'Created At',
      'Last Message At',
      'Notes'
    ];

    const csvRows = [headers.join(',')];

    conversations?.forEach(convo => {
      const row = [
        convo.id,
        escapeCSV(convo.customer_name || ''),
        escapeCSV(convo.customer_email || ''),
        escapeCSV(convo.customer_phone || ''),
        escapeCSV(convo.customer_instagram_id || ''),
        escapeCSV(convo.channel || ''),
        escapeCSV(convo.status || ''),
        escapeCSV(String(convo.unread_count || 0)),
        escapeCSV(convo.created_at || ''),
        escapeCSV(convo.last_message_at || ''),
        escapeCSV(convo.notes || '')
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `conversations-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// Helper function to escape CSV fields
function escapeCSV(field: string): string {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  // If field contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}
