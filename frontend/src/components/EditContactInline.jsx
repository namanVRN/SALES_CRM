// components/EditContactInline.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditContactInline = ({ uniqueId, currentContact, queryKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newContact, setNewContact] = useState(currentContact || '');
  const queryClient = useQueryClient();

  const updateContactMutation = useMutation({
    mutationFn: async (contact) => {
      const res = await axios.post('/cp/update-contact-by-uid', {
        uniqueId,           // ← backend will use this to find the row
        newContact: contact,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Contact number updated successfully!');
      setIsEditing(false);

      // Refresh the table data — import formula will sync automatically
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to update contact number';
      toast.error(errorMsg);
    },
  });

  const handleSave = () => {
    const cleaned = newContact.trim();

    // Validation: exactly 10 digits, starts with 6-9
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      toast.error('Invalid number! Must be 10 digits starting with 6-9.');
      return;
    }

    updateContactMutation.mutate(cleaned);
  };

  const handleCancel = () => {
    setNewContact(currentContact || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a
          href={currentContact ? `tel:${currentContact}` : '#'}
          className="contact-link"
          style={{ textDecoration: 'none', color: currentContact ? '#2563eb' : '#9ca3af' }}
        >
          <i className="bi bi-telephone-fill" style={{ marginRight: '6px' }}></i>
          {currentContact || 'No Contact'}
        </a>

        <button
          onClick={() => setIsEditing(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '1rem',
            padding: '4px',
          }}
          title="Edit Contact Number"
        >
          <i className="bi bi-pencil-square"></i>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <input
        type="text"
        value={newContact}
        onChange={(e) => setNewContact(e.target.value)}
        placeholder="Enter 10-digit number"
        maxLength={10}
        autoFocus
        style={{
          width: '160px',
          padding: '6px 10px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '0.95rem',
          outline: 'none',
        }}
      />

      <button
        onClick={handleSave}
        disabled={updateContactMutation.isPending}
        style={{
          background: updateContactMutation.isPending ? '#6ee7b7' : '#10b981',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: updateContactMutation.isPending ? 'not-allowed' : 'pointer',
          minWidth: '70px',
        }}
      >
        {updateContactMutation.isPending ? 'Saving...' : 'Save'}
      </button>

      <button
        onClick={handleCancel}
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          minWidth: '70px',
        }}
      >
        Cancel
      </button>
    </div>
  );
};

export default EditContactInline;