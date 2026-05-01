export interface TreeNode {
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  class?: number;
}

export interface RandomForestModel {
  classes: string[];
  forest: TreeNode[];
}

export class RandomForestClassifier {
  private model: RandomForestModel;

  constructor(model: RandomForestModel) {
    this.model = model;
  }

  private predictTree(node: TreeNode, features: number[]): number {
    if (node.class !== undefined) {
      return node.class;
    }
    
    // Safety check in case of malformed tree
    if (node.feature === undefined || node.threshold === undefined) {
      throw new Error("Invalid node structure");
    }

    if (features[node.feature] <= node.threshold) {
      return this.predictTree(node.left!, features);
    } else {
      return this.predictTree(node.right!, features);
    }
  }

  public predict(features: number[]): string {
    const votes: Record<string, number> = {};

    for (const tree of this.model.forest) {
      const classIdx = this.predictTree(tree, features);
      const cls = this.model.classes[classIdx];
      votes[cls] = (votes[cls] || 0) + 1;
    }

    let maxVotes = -1;
    let bestClass = "";

    for (const [cls, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        bestClass = cls;
      }
    }

    return bestClass;
  }
}
