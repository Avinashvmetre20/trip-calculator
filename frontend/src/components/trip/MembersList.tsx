import { useState } from 'react';
import { Plus, Trash2, Shield, User as UserIcon, Link as LinkIcon, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { generateInviteLink } from '../../services/tripService';

interface Member {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

interface MembersListProps {
  tripId: number;
  members: Member[];
  onUpdate: () => void;
  currentUserRole?: 'admin' | 'member';
}

const MembersList = ({ tripId, members, onUpdate, currentUserRole }: MembersListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/trips/${tripId}/members`, { email });
      setEmail('');
      setIsAdding(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/trips/${tripId}/members/${userId}`);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const link = await generateInviteLink(tripId);
      setInviteLink(link);
    } catch (err) {
      console.error('Failed to generate link', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Members</h2>
        {currentUserRole === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateLink}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
              title="Generate Invite Link"
            >
              <LinkIcon size={20} />
            </button>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
              title="Add Member by Email"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {inviteLink && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
          <p className="text-xs text-blue-600 font-semibold mb-1">Invite Link</p>
          <div className="flex justify-between items-center">
            <span className="text-sm truncate mr-2 text-gray-700">{inviteLink}</span>
            <button onClick={copyToClipboard} className="text-blue-600 hover:text-blue-800">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAddMember} className="mb-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              className="flex-1 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              Add
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </form>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 p-2 rounded-full">
                <UserIcon size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium">{member.name || member.email}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.role === 'admin' && (
                <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  <Shield size={12} className="mr-1" /> Admin
                </span>
              )}
              {currentUserRole === 'admin' && member.role !== 'admin' && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersList;
