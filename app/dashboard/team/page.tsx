'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Crown, Shield, Users, Eye, Mail, Trash2, X, Loader2, Link2, Edit3, AlertCircle, CheckCircle, Copy, Send } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
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

  const currentMember = members.find(m => m.user_id === currentBusiness?.member_role);
  const canManageTeam = currentBusiness && hasPermission(currentBusiness.member_role, 'INVITE_MEMBERS');

  useEffect(() => {
    if (currentBusiness) {
      fetchTeamData();
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

  async function fetchTeamData() {
    if (!currentBusiness) return;

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
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !currentBusiness) return;

    setInviting(true);
    setError('');

    try {
      // Create the invitation
      const response = await fetch(`/api/team/invitations?businessId=${currentBusiness.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      const { inviteUrl: url, invitation } = await response.json();

      // Automatically send the email
      setSendingEmail(true);
      try {
        const emailResponse = await fetch(
          `/api/team/invitations?businessId=${currentBusiness.id}&invitationId=${invitation.id}`,
          { method: 'PATCH' }
        );

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json();
          throw new Error(emailError.error || 'Failed to send email');
        }

        setActionSuccess(`Invitation sent to ${inviteEmail}!`);
      } catch (emailError: any) {
        console.error('Failed to send email:', emailError);
        setActionError(`Invitation created but email failed to send: ${emailError.message}`);
      } finally {
        setSendingEmail(false);
      }

      setInviteUrl(url);
      setCreatedInvitationId(invitation.id);
      setInviteEmail('');
      setInviteRole('agent');
      await fetchTeamData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setInviting(false);
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
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
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
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members ({members.length})</h2>
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
                    {/* Change Role Button */}
                    {editingMemberId === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as Role)}
                          className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                          {currentBusiness.member_role === 'owner' && (
                            <option value="owner">Owner</option>
                          )}
                        </select>
                        <button
                          onClick={() => handleChangeRole(member.id, newRole)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
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

                    {/* Remove Member Button */}
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="group text-red-600 hover:text-white p-2 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
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

            {inviteUrl ? (
              <div>
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
                <div className="flex gap-2">
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
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteUrl('');
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="agent">Agent (Handle messages)</option>
                    <option value="admin">Admin (Manage team)</option>
                    {currentBusiness.member_role === 'owner' && (
                      <option value="owner">Owner (Full control)</option>
                    )}
                  </select>
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
