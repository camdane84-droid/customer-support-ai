'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Crown, Shield, Users, Eye, Mail, Trash2, X, Loader2 } from 'lucide-react';
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

  const currentMember = members.find(m => m.user_id === currentBusiness?.member_role);
  const canManageTeam = currentBusiness && hasPermission(currentBusiness.member_role, 'INVITE_MEMBERS');

  useEffect(() => {
    if (currentBusiness) {
      fetchTeamData();
    }
  }, [currentBusiness]);

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

      const { inviteUrl: url } = await response.json();
      setInviteUrl(url);
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
        throw new Error('Failed to remove member');
      }

      await fetchTeamData();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove team member');
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
        throw new Error('Failed to revoke invitation');
      }

      await fetchTeamData();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      alert('Failed to revoke invitation');
    }
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
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-1">
          Manage team members and invitations for {currentBusiness.name}
        </p>
      </div>

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
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No team members found</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.email}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                      <span>•</span>
                      <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {canManageTeam && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="group text-red-600 hover:text-white p-2 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Mail className="w-10 h-10 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{invitation.email}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                      <span>•</span>
                      <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {canManageTeam && (
                  <button
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    className="group text-red-600 hover:text-white p-2 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md hover:rotate-90 active:scale-95"
                    title="Revoke invitation"
                  >
                    <X className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUrl('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteUrl ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Invitation sent! Share this link with the new team member:
                </p>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <code className="text-sm text-gray-800 break-all">{inviteUrl}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
    </div>
  );
}
