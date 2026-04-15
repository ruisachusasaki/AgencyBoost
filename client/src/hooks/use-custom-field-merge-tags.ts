import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export interface MergeTagOption {
  tag: string;
  label: string;
  description: string;
  group: string;
}

export interface MergeTagGroup {
  label: string;
  tags: { label: string; value: string }[];
}

function buildCustomFieldTag(fieldName: string): string {
  return `{{custom.${fieldName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()}}}`;
}

export function useCustomFieldMergeTags() {
  const { data: customFieldsList = [] } = useQuery<{ id: string; name: string; type: string; folderId?: string }[]>({
    queryKey: ["/api/custom-fields"],
    staleTime: 30000,
  });

  const customFieldTagOptions = useMemo<MergeTagOption[]>(() => {
    return customFieldsList.map((field) => ({
      tag: buildCustomFieldTag(field.name),
      label: field.name,
      description: `Custom field (${field.type})`,
      group: "Custom Fields",
    }));
  }, [customFieldsList]);

  const customFieldTagGroup = useMemo<MergeTagGroup[]>(() => {
    if (customFieldsList.length === 0) return [];
    return [{
      label: "Custom Fields",
      tags: customFieldsList.map((field) => ({
        label: field.name,
        value: buildCustomFieldTag(field.name),
      })),
    }];
  }, [customFieldsList]);

  return { customFieldTagOptions, customFieldTagGroup, customFieldsList };
}
