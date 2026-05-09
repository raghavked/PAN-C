import React, { CSSProperties } from 'react';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { SecondaryButton } from '../components/buttons/SecondaryButton';
import { colors, spacingNum, typography } from '../theme';

interface Document {
  id: string;
  type: string;
  icon: string;
  id_number: string;
  expires: string;
  status: 'ready' | 'expiring' | 'expired';
}

const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    type: 'Passport',
    icon: '🛂',
    id_number: '123456789',
    expires: '12/28/2027',
    status: 'ready',
  },
  {
    id: '2',
    type: 'Work Visa',
    icon: '📝',
    id_number: 'W-987654',
    expires: '06/27/2028',
    status: 'ready',
  },
  {
    id: '3',
    type: 'State ID',
    icon: '🆔',
    id_number: 'DL-456789',
    expires: 'In 11 days',
    status: 'expiring',
  },
];

export const DocumentsScreen: React.FC = () => {
  const contentStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.lg,
    paddingBottom: spacingNum.xxl,
  };

  const sectionTitleStyle = (isWarning = false): CSSProperties => ({
    ...typography.headlineSmall,
    color: isWarning ? colors.warning : colors.onSurface,
    marginBottom: spacingNum.lg,
    marginTop: spacingNum.xl,
    display: 'block',
  });

  const docHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingNum.md,
  };

  const docTitleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacingNum.md,
    marginBottom: spacingNum.sm,
  };

  const docMetaStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacingNum.xs,
  };

  const actionsRowStyle: CSSProperties = {
    display: 'flex',
    gap: spacingNum.md,
    marginTop: spacingNum.md,
  };

  const readyDocs = MOCK_DOCUMENTS.filter((d) => d.status === 'ready');
  const expiringDocs = MOCK_DOCUMENTS.filter((d) => d.status === 'expiring' || d.status === 'expired');

  return (
    <div style={contentStyle}>
      <p style={{ ...typography.bodySmall, color: colors.onSurfaceVariant, marginBottom: spacingNum.md }}>
        Store copies of your important documents. These will be shared with your contacts in an emergency.
      </p>

      {/* Ready to Share */}
      <span style={sectionTitleStyle()}>✓ Ready to Share ({readyDocs.length})</span>

      {readyDocs.map((doc) => (
        <Card key={doc.id}>
          <div style={docHeaderStyle}>
            <div>
              <div style={docTitleRowStyle}>
                <span style={{ fontSize: 28 }}>{doc.icon}</span>
                <span style={{ ...typography.bodyMedium, color: colors.onSurface, fontWeight: '700' }}>
                  {doc.type}
                </span>
              </div>
              <p style={docMetaStyle}>ID: {doc.id_number}</p>
              <p style={docMetaStyle}>Expires: {doc.expires}</p>
            </div>
            <StatusBadge label="Visible" status="success" />
          </div>
          <div style={actionsRowStyle}>
            <div style={{ flex: 1 }}>
              <SecondaryButton label="Edit" onPress={() => console.log('Edit', doc.id)} size="small" />
            </div>
            <div style={{ flex: 1 }}>
              <SecondaryButton label="Delete" onPress={() => console.log('Delete', doc.id)} size="small" />
            </div>
          </div>
        </Card>
      ))}

      {/* Expiring Soon */}
      {expiringDocs.length > 0 && (
        <>
          <span style={sectionTitleStyle(true)}>⚠️ Expiring Soon ({expiringDocs.length})</span>

          {expiringDocs.map((doc) => (
            <Card
              key={doc.id}
              style={{ border: `2px solid ${colors.warning}` }}
            >
              <div style={docHeaderStyle}>
                <div>
                  <div style={docTitleRowStyle}>
                    <span style={{ fontSize: 28 }}>{doc.icon}</span>
                    <span style={{ ...typography.bodyMedium, color: colors.onSurface, fontWeight: '700' }}>
                      {doc.type}
                    </span>
                  </div>
                  <p style={{ ...docMetaStyle, color: colors.warning, fontWeight: '700' }}>
                    ⚠️ Expires: {doc.expires}
                  </p>
                  <p style={docMetaStyle}>ID: {doc.id_number}</p>
                </div>
                <StatusBadge label="Expiring" status="error" />
              </div>
              <div style={actionsRowStyle}>
                <div style={{ flex: 1 }}>
                  <PrimaryButton label="Renew" onPress={() => console.log('Renew', doc.id)} size="small" />
                </div>
                <div style={{ flex: 1 }}>
                  <SecondaryButton label="Edit" onPress={() => console.log('Edit', doc.id)} size="small" />
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      <div style={{ marginTop: spacingNum.xl, marginBottom: spacingNum.xxl }}>
        <PrimaryButton
          label="+ Upload Document"
          onPress={() => console.log('Upload document')}
        />
      </div>

      <Card style={{ backgroundColor: colors.surfaceContainerHigh }}>
        <p style={{ ...typography.labelLarge, color: colors.onSurface, marginBottom: spacingNum.sm }}>
          🔒 Encrypted & Secure
        </p>
        <p style={{ ...typography.bodySmall, color: colors.onSurfaceVariant }}>
          All documents are encrypted at rest. Only you and your designated contacts can access them during an emergency.
        </p>
      </Card>
    </div>
  );
};
