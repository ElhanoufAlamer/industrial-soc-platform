import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiCallOut,
  EuiDescriptionList,
  EuiFieldSearch,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { SocTechnique } from './data/types';

interface MitrePageProps {
  techniques: SocTechnique[];
}

function renderRelatedAlertIds(alertIds: string[]): React.ReactNode {
  if (!alertIds.length) {
    return 'No linked alerts';
  }

  return alertIds.map((alertId) => (
    <EuiBadge key={alertId} color="hollow">
      {alertId}
    </EuiBadge>
  ));
}

export const IndustrialSocMitrePage: React.FC<MitrePageProps> = ({ techniques }) => {
  const [search, setSearch] = useState('');
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const filteredTechniques = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return techniques.filter(
      (technique) =>
        !query ||
        [
          technique.id,
          technique.tactic,
          technique.name,
          technique.description,
          technique.observation,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)
    );
  }, [techniques, search]);

  const tactics = useMemo(() => {
    const grouped = new Map<string, SocTechnique[]>();
    filteredTechniques.forEach((technique) => {
      const current = grouped.get(technique.tactic) || [];
      grouped.set(technique.tactic, [...current, technique]);
    });

    return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [filteredTechniques]);
  const selectedTechnique =
    filteredTechniques.find((technique) => technique.id === selectedTechniqueId) || null;

  return (
    <>
      <EuiCallOut color="warning" iconType="alert" title="Illustrative ATT&CK mappings">
        These illustrative technique associations do not represent verified detections or an
        official live ATT&CK evaluation.
      </EuiCallOut>
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="l" className="industrial-soc-panel">
        <div className="industrial-soc-page-title">
          <EuiTitle size="s">
            <h2>MITRE ATT&CK for ICS technique matrix</h2>
          </EuiTitle>
          <EuiText color="subdued" size="s">
            Select a technique to inspect its mapping.
          </EuiText>
        </div>
        <EuiSpacer size="m" />
        <EuiFieldSearch
          aria-label="Search MITRE ICS techniques"
          placeholder="Search by tactic, technique, or ID"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          isClearable
        />
        <EuiSpacer size="m" />
        {tactics.length ? (
          <div className="industrial-soc-technique-matrix">
            {tactics.map(([tactic, tacticTechniques]) => (
              <section
                className="industrial-soc-tactic-column"
                key={tactic}
                aria-label={`${tactic} tactic`}
              >
                <h3>{tactic}</h3>
                <div className="industrial-soc-technique-list">
                  {tacticTechniques.map((technique) => (
                    <EuiButton
                      key={technique.id}
                      className="industrial-soc-technique-button"
                      color={selectedTechniqueId === technique.id ? 'primary' : 'text'}
                      fill={selectedTechniqueId === technique.id}
                      size="s"
                      onClick={() => setSelectedTechniqueId(technique.id)}
                      aria-pressed={selectedTechniqueId === technique.id}
                    >
                      <span>
                        <strong>{technique.name}</strong>
                        <small>{technique.id}</small>
                      </span>
                    </EuiButton>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EuiText color="subdued">No techniques match this search.</EuiText>
        )}

        {selectedTechnique && (
          <>
            <EuiSpacer size="l" />
            <EuiPanel paddingSize="l" className="industrial-soc-technique-details">
              <div className="industrial-soc-page-title">
                <EuiTitle size="s">
                  <h3>{selectedTechnique.name}</h3>
                </EuiTitle>
                <EuiText color="subdued" size="s">
                  {selectedTechnique.tactic}
                </EuiText>
              </div>
              <EuiSpacer size="m" />
              <EuiDescriptionList
                type="column"
                listItems={[
                  { title: 'Technique ID', description: selectedTechnique.id },
                  {
                    title: 'Description',
                    description: selectedTechnique.description,
                  },
                  {
                    title: 'Illustrative observation',
                    description: selectedTechnique.observation,
                  },
                  {
                    title: 'Related alert IDs',
                    description: (
                      <span className="industrial-soc-technique-alerts">
                        {renderRelatedAlertIds(selectedTechnique.relatedAlertIds)}
                      </span>
                    ),
                  },
                ]}
              />
              <EuiSpacer size="m" />
              <EuiButton size="s" onClick={() => setSelectedTechniqueId(null)}>
                Clear selection
              </EuiButton>
            </EuiPanel>
          </>
        )}
      </EuiPanel>
    </>
  );
};
