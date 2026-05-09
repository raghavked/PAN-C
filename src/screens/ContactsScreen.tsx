import React, { useState, CSSProperties } from 'react';
import { Card } from '../components/cards/Card';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { SecondaryButton } from '../components/buttons/SecondaryButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { colors, spacingNum, typography } from '../theme';

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notifyMethods: string[];
  priority: number;
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Maria Garcia',
    relationship: 'Mom',
    phone: '(555) 123-4567',
    notifyMethods: ['SMS', 'Email'],
    priority: 1,
  },
  {
    id: '2',
    name: 'Carlos Lopez',
    relationship: 'Lawyer',
    phone: '(555) 987-6543',
    notifyMethods: ['SMS', 'Email', 'Push'],
    priority: 2,
  },
  {
    id: '3',
    name: 'Ana Rodriguez',
    relationship: 'Sister',
    phone: '(555) 456-7890',
    notifyMethods: ['SMS'],
    priority: 3,
  },
  {
    id: '4',
    name: 'RAICES Legal Hotline',
    relationship: 'Legal Aid',
    phone: '1-888-587-7777',
    notifyMethods: ['SMS', 'Email'],
    priority: 4,
  },
];

export const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);

  const contentStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.lg,
    paddingBottom: spacingNum.xxl,
  };

  const contactHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingNum.md,
  };

  const contactNameStyle: CSSProperties = {
    ...typography.headlineSmall,
    color: colors.onSurface,
    marginBottom: spacingNum.xs,
  };

  const contactRelStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  };

  const contactPhoneStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacingNum.md,
  };

  const methodsRowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacingNum.sm,
    marginBottom: spacingNum.md,
  };

  const methodBadgeStyle: CSSProperties = {
    ...typography.labelMedium,
    color: colors.primary,
    backgroundColor: 'rgba(226, 75, 74, 0.12)',
    border: `1px solid rgba(226, 75, 74, 0.3)`,
    borderRadius: 4,
    paddingLeft: spacingNum.sm,
    paddingRight: spacingNum.sm,
    paddingTop: spacingNum.xs,
    paddingBottom: spacingNum.xs,
  };

  const actionsRowStyle: CSSProperties = {
    display: 'flex',
    gap: spacingNum.md,
  };

  const priorityBadgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    fontSize: '0.75rem',
    fontWeight: '700',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    flexShrink: 0,
  };

  const handleRemove = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={contentStyle}>
      <p style={{ ...typography.bodySmall, color: colors.onSurfaceVariant, marginBottom: spacingNum.lg }}>
        These contacts will be notified immediately when you trigger the panic button.
      </p>

      {contacts.map((contact) => (
        <Card key={contact.id}>
          <div style={contactHeaderStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacingNum.sm, marginBottom: spacingNum.xs }}>
                <span style={priorityBadgeStyle}>#{contact.priority}</span>
                <h3 style={contactNameStyle}>{contact.name}</h3>
              </div>
              <p style={contactRelStyle}>{contact.relationship}</p>
            </div>
            <StatusBadge label="Active" status="success" />
          </div>

          <p style={contactPhoneStyle}>📞 {contact.phone}</p>

          <div style={methodsRowStyle}>
            {contact.notifyMethods.map((method) => (
              <span key={method} style={methodBadgeStyle}>
                ✓ {method}
              </span>
            ))}
          </div>

          <div style={actionsRowStyle}>
            <div style={{ flex: 1 }}>
              <SecondaryButton label="Edit" onPress={() => console.log('Edit', contact.id)} size="small" />
            </div>
            <div style={{ flex: 1 }}>
              <SecondaryButton label="Remove" onPress={() => handleRemove(contact.id)} size="small" />
            </div>
          </div>
        </Card>
      ))}

      <div style={{ marginTop: spacingNum.lg, marginBottom: spacingNum.xxl }}>
        <PrimaryButton
          label="+ Add Emergency Contact"
          onPress={() => console.log('Add contact')}
        />
      </div>

      <Card style={{ backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.border}` }}>
        <p style={{ ...typography.labelLarge, color: colors.onSurface, marginBottom: spacingNum.sm }}>
          💡 Tip
        </p>
        <p style={{ ...typography.bodySmall, color: colors.onSurfaceVariant }}>
          Add at least one legal contact (lawyer or legal aid organization) who can act quickly if you are detained.
        </p>
      </Card>
    </div>
  );
};
