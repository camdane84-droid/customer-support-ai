'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Crown, Shield, Users, Eye, Mail, Trash2, X, Loader2, Link2, Edit3, AlertCircle, CheckCircle, Copy, Send, RefreshCw } from 'lucide-react';
import { hasPermission, canChangeRole } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

interface TeamMember {
  id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  email: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: Role;
  token: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export default function TeamPage() {
  const { currentBusiness } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('agent');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [createdInvitationId, setCreatedInvitationId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [viewingInviteId, setViewingInviteId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<Role>('agent');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [bulkInviteResults, setBulkInviteResults] = useState<{
    successful: string[];
    failed: { email: string; error: string }[];
  } | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const currentMember = members.find(m => m.user_id === currentBusiness?.member_role);
  const canManageTeam = currentBusiness && hasPermission(currentBusiness.member_role, 'INVITE_MEMBERS');
  const canRemoveMembers = currentBusiness && hasPermission(currentBusiness.member_role, 'REMOVE_MEMBERS');

  useEffect(() => {
    if (currentBusiness) {
      fetchTeamData();

      // Poll for new members every 10 seconds to catch accepted invitations
      const pollInterval = setInterval(() => {
        fetchTeamData();
      }, 10000); // 10 seconds

      return () => clearInterval(pollInterval);
    }
  }, [currentBusiness]);

  // Auto-dismiss action errors after 5 seconds
  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  async function fetchTeamData(isManualRefresh = false) {
    if (!currentBusiness) return;

    if (isManualRefresh) setRefreshing(true);

    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch(`/api/team/members?businessId=${currentBusiness.id}`),
        fetch(`/api/team/invitations?businessId=${currentBusiness.id}`)
      ]);

      if (membersRes.ok) {
        const { members: membersList } = await membersRes.json();
        setMembers(membersList || []);
      }

      if (invitationsRes.ok) {
        const { invitations: invitationsList } = await invitationsRes.json();
        setInvitations(invitationsList?.filter((inv: TeamInvitation) => inv.status === 'pending') || []);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !currentBusiness) return;

    setInviting(true);
    setError('');
    setBulkInviteResults(null);

    try {
      // Parse multiple emails (comma or newline separated)
      const emails = inviteEmail
        .split(/[,\n]/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

      if (emails.length === 0) {
        throw new Error('Please enter at least one email address');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
      }

      const successful: string[] = [];
      const failed: { email: string; error: string }[] = [];

      // Process each email
      for (const email of emails) {
        try {
          // Create the invitation
          const response = await fetch(`/api/team/invitations?businessId=${currentBusiness.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              role: inviteRole,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            failed.push({ email, error: data.error || 'Failed to create invitation' });
            continue;
          }

          const { inviteUrl: url, invitation } = await response.json();

          // Automatically send the email
          try {
            const emailResponse = await fetch(
              `/api/team/invitations?businessId=${currentBusiness.id}&invitationId=${invitation.id}`,
              { method: 'PATCH' }
            );

            if (!emailResponse.ok) {
              const emailError = await emailResponse.json();
              failed.push({ email, error: emailError.error || 'Failed to send email' });
              continue;
            }

            successful.push(email);

            // Store the last successful invitation for the modal
            if (emails.length === 1) {
              setInviteUrl(url);
              setCreatedInvitationId(invitation.id);
            }
          } catch (emailError: any) {
            failed.push({ email, error: emailError.message || 'Failed to send email' });
          }
        } catch (inviteError: any) {
          failed.push({ email, error: inviteError.message || 'Failed to create invitation' });
        }
      }

      // Set results
      setBulkInviteResults({ successful, failed });

      // Show appropriate message
      if (successful.length > 0) {
        if (emails.length === 1) {
          setActionSuccess(`Invitation sent to ${successful[0]}!`);
        } else {
          setActionSuccess(`Successfully sent ${successful.length} invitation(s)!`);
        }
      }

      if (failed.length > 0 && successful.length === 0) {
        setError(`Failed to send all invitations. Check the results below.`);
      }

      setInviteEmail('');
      setInviteRole('agent');
      await fetchTeamData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setInviting(false);
      setSendingEmail(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    if (!currentBusiness) return;

    try {
      const response = await fetch(
        `/api/team/members?businessId=${currentBusiness.id}&memberId=${memberId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setActionSuccess('Team member removed successfully');
      await fetchTeamData();
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      setActionError(error.message || 'Failed to remove team member');
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!currentBusiness) return;

    try {
      const response = await fetch(
        `/api/team/invitations?businessId=${currentBusiness.id}&invitationId=${invitationId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke invitation');
      }

      setActionSuccess('Invitation revoked successfully');
      await fetchTeamData();
    } catch (error: any) {
      console.error('Failed to revoke invitation:', error);
      setActionError(error.message || 'Failed to revoke invitation');
    }
  }

  async function handleSendInviteEmail(invitationId: string) {
    if (!currentBusiness) return;

    setSendingEmail(true);
    try {
      const response = await fetch(
        `/api/team/invitations?businessId=${currentBusiness.id}&invitationId=${invitationId}`,
        { method: 'PATCH' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      setActionSuccess('Invitation email sent successfully!');
      setShowInviteModal(false);
      setInviteUrl('');
      setCreatedInvitationId(null);
    } catch (error: any) {
      console.error('Failed to send invitation email:', error);
      setActionError(error.message || 'Failed to send invitation email');
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleResendInvite(invitationId: string) {
    if (!currentBusiness) return;

    try {
      const response = await fetch(
        `/api/team/invitations?businessId=${currentBusiness.id}&invitationId=${invitationId}`,
        { method: 'PATCH' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend invitation');
      }

      setActionSuccess('Invitation email resent successfully!');
      await fetchTeamData();
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      setActionError(error.message || 'Failed to resend invitation');
    }
  }

  async function handleChangeRole(memberId: string, role: Role) {
    if (!currentBusiness) return;

    try {
      const response = await fetch(
        `/api/team/members/${memberId}?businessId=${currentBusiness.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setActionSuccess(`Member role updated to ${role} successfully`);
      setEditingMemberId(null);
      await fetchTeamData();
    } catch (error: any) {
      console.error('Failed to change role:', error);
      setActionError(error.message || 'Failed to change member role');
    }
  }

  function getInviteUrl(token: string) {
    return `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/invite/${token}`;
  }

  function getRoleIcon(role: Role) {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'agent': return <Users className="w-4 h-4 text-green-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-slate-700 dark:text-slate-400" />;
    }
  }

  function getRoleLabel(role: Role) {
    switch (role) {
      case 'owner': return 'Owner (Full control)';
      case 'admin': return 'Admin (Manage team)';
      case 'agent': return 'Agent (Handle messages)';
      case 'viewer': return 'Viewer (Read-only)';
    }
  }

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">
          Manage team members and invitations for {currentBusiness.name}
        </p>
      </div>

      {/* Error Banner */}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{actionError}</p>
            </div>
          </div>
          <button
            onClick={() => setActionError('')}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {actionSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-1">{actionSuccess}</p>
            </div>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-green-400 hover:text-green-600 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {canManageTeam && (
        <div className="mb-6">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Invite Team Member
          </button>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members ({members.length})</h2>
          <button
            onClick={() => fetchTeamData(true)}
            disabled={refreshing}
            className="p-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh team list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">No team members found</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{member.email}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                      <span>•</span>
                      <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {canManageTeam && member.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    {/* Change Role Button - Only show if user can change this member's role */}
                    {hasPermission(currentBusiness.member_role, 'UPDATE_MEMBER_ROLES') && (
                      <>
                        {editingMemberId === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value as Role)}
                              className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                              {/* Viewer option - available if admin can change to viewer or owner can */}
                              {canChangeRole(currentBusiness.member_role, member.role, 'viewer') && (
                                <option value="viewer">Viewer</option>
                              )}
                              {/* Agent option - available if admin can change to agent or owner can */}
                              {canChangeRole(currentBusiness.member_role, member.role, 'agent') && (
                                <option value="agent">Agent</option>
                              )}
                              {/* Admin option - only owner can assign/demote admins */}
                              {canChangeRole(currentBusiness.member_role, member.role, 'admin') && (
                                <option value="admin">Admin</option>
                              )}
                              {/* Owner option - only owner can assign owner role */}
                              {canChangeRole(currentBusiness.member_role, member.role, 'owner') && (
                                <option value="owner">Owner</option>
                              )}
                            </select>
                            <button
                              onClick={() => handleChangeRole(member.id, newRole)}
                              disabled={!canChangeRole(currentBusiness.member_role, member.role, newRole)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMemberId(null)}
                              className="px-3 py-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setNewRole(member.role);
                            }}
                            className="group text-blue-600 hover:text-white p-2 hover:bg-blue-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                            title="Change role"
                          >
                            <Edit3 className="w-4 h-4 transition-transform group-hover:scale-110" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Remove Member Button - Only owners can delete members */}
                    {canRemoveMembers && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="group text-red-600 hover:text-white p-2 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations - Only for owners and admins */}
      {canManageTeam && invitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <Mail className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{invitation.email}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                      <span>•</span>
                      <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {canManageTeam && (
                  <div className="flex items-center gap-2">
                    {/* View Link Button */}
                    <button
                      onClick={() => setViewingInviteId(invitation.id)}
                      className="group text-blue-600 hover:text-white p-2 hover:bg-blue-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                      title="View invitation link"
                    >
                      <Link2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>

                    {/* Resend Button */}
                    <button
                      onClick={() => handleResendInvite(invitation.id)}
                      className="group text-green-600 hover:text-white p-2 hover:bg-green-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                      title="Resend invitation email"
                    >
                      <Send className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>

                    {/* Revoke Button */}
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="group text-red-600 hover:text-white p-2 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md hover:rotate-90 active:scale-95"
                      title="Revoke invitation"
                    >
                      <X className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Team Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUrl('');
                  setError('');
                }}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteUrl || bulkInviteResults ? (
              <div>
                {/* Single invitation success */}
                {inviteUrl && (
                  <>
                    <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          Invitation email sent successfully!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          This invitation will expire in 7 days
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                      Backup invitation link (in case the email doesn't arrive):
                    </p>
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 mb-4">
                      <code className="text-sm text-gray-800 dark:text-slate-200 break-all">{inviteUrl}</code>
                    </div>
                  </>
                )}

                {/* Bulk invitation results */}
                {bulkInviteResults && bulkInviteResults.successful.length > 1 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          Successfully sent {bulkInviteResults.successful.length} invitation(s)!
                        </p>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3">
                      <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Successful:</p>
                      <ul className="space-y-1">
                        {bulkInviteResults.successful.map((email) => (
                          <li key={email} className="text-sm text-gray-800 dark:text-slate-200 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                            {email}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {bulkInviteResults.failed.length > 0 && (
                      <div className="mt-3 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Failed:</p>
                        <ul className="space-y-1">
                          {bulkInviteResults.failed.map(({ email, error }) => (
                            <li key={email} className="text-sm text-red-800 dark:text-red-200">
                              <span className="font-medium">{email}:</span> {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {inviteUrl && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteUrl);
                          setActionSuccess('Invitation link copied to clipboard!');
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      {createdInvitationId && (
                        <button
                          onClick={() => handleResendInvite(createdInvitationId)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Resend
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteUrl('');
                      setError('');
                      setBulkInviteResults(null);
                    }}
                    className={`${inviteUrl ? '' : 'flex-1'} px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2`}
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Email Addresses
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                    Enter one or more emails (separated by commas or new lines)
                  </p>
                  <textarea
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                    placeholder="colleague@example.com, teammate@example.com"
                    rows={3}
                  />
                </div>

                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getRoleIcon(inviteRole)}
                      <span>{getRoleLabel(inviteRole)}</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => { setInviteRole('viewer'); setShowRoleDropdown(false); }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-left text-gray-900 dark:text-white"
                      >
                        <Eye className="w-4 h-4 text-slate-700 dark:text-slate-400" />
                        <span>Viewer (Read-only)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setInviteRole('agent'); setShowRoleDropdown(false); }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-left text-gray-900 dark:text-white"
                      >
                        <Users className="w-4 h-4 text-green-600" />
                        <span>Agent (Handle messages)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setInviteRole('admin'); setShowRoleDropdown(false); }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-left text-gray-900 dark:text-white"
                      >
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Admin (Manage team)</span>
                      </button>
                      {currentBusiness.member_role === 'owner' && (
                        <button
                          type="button"
                          onClick={() => { setInviteRole('owner'); setShowRoleDropdown(false); }}
                          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-left text-gray-900 dark:text-white"
                        >
                          <Crown className="w-4 h-4 text-yellow-600" />
                          <span>Owner (Full control)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Invite Link Modal */}
      {viewingInviteId && (() => {
        const invitation = invitations.find(inv => inv.id === viewingInviteId);
        if (!invitation) return null;
        const inviteLink = getInviteUrl(invitation.token);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invitation Link</h3>
                <button
                  onClick={() => setViewingInviteId(null)}
                  className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
                  Invited: <span className="font-medium text-gray-900 dark:text-white">{invitation.email}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Role: <span className="font-medium text-gray-900 dark:text-white capitalize">{invitation.role}</span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 mb-4">
                <code className="text-sm text-gray-800 dark:text-slate-200 break-all">{inviteLink}</code>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setActionSuccess('Invitation link copied to clipboard!');
                  setViewingInviteId(null);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
        );
      })()}
      </div>
    </DashboardLayout>
  );
}
