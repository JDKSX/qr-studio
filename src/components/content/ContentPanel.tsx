import { getSchema } from "../../core/encode/contentSchemas";
import { useT } from "../../hooks/useT";
import { useStudio } from "../../state/store";
import { Card } from "../ui/Card";
import { Button } from "../ui/controls";
import { ContentForm, ContentTypeChips, PrivacyNote } from "./ContentFields";

export function ContentPanel() {
  const t = useT();
  const contentType = useStudio((state) => state.contentType);
  const resetContent = useStudio((state) => state.resetContent);

  return (
    <Card
      title={t("content.title")}
      description={t(getSchema(contentType).hintKey)}
      aside={
        <Button size="sm" variant="ghost" onClick={resetContent}>
          {t("common.clear")}
        </Button>
      }
    >
      <ContentTypeChips />
      <ContentForm />
      <PrivacyNote />
    </Card>
  );
}
