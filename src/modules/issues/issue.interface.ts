export interface ICreateIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}
