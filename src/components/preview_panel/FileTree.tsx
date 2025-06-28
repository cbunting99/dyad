import * as React from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileAudio,
  FileVideo,
  Package,
  GitBranch,
  Book,
  Database,
  Settings,
  Terminal,
  Key,
  Lock,
  Shield,
  FolderDot,
  FolderKanban,
  FolderTree,
} from "lucide-react";
import { selectedFileAtom } from "@/atoms/viewAtoms";
import { useSetAtom } from "jotai";

interface FileTreeProps {
  files: string[];
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
}

// Helper to get file icon based on extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "html":
    case "htm":
    case "css":
    case "scss":
    case "less":
      return FileCode; // Generic code file icon
    case "json":
      return FileJson;
    case "md":
    case "txt":
      return FileText;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return FileImage;
    case "mp3":
    case "wav":
      return FileAudio;
    case "mp4":
    case "mov":
      return FileVideo;
    case "zip":
    case "tar":
    case "gz":
      return File; // Generic file icon for archives
    case "lock":
      return Lock; // For package-lock.json, yarn.lock etc.
    case "env":
      return Key; // For .env files
    case "git":
      return GitBranch; // For .gitignore, .gitattributes
    case "db":
    case "sqlite":
      return Database; // For database files
    case "config":
    case "settings":
      return Settings; // For config files
    case "sh":
    case "bash":
    case "zsh":
      return Terminal; // For shell scripts
    default:
      return File;
  }
};

// Helper to get folder icon based on folder name
const getFolderIcon = (folderName: string, expanded: boolean) => {
  switch (folderName.toLowerCase()) {
    case "src":
    case "source":
    case "app":
    case "components":
    case "pages":
    case "public":
    case "assets":
    case "images":
    case "dist":
    case "build":
      return expanded ? FolderOpen : Folder; // Use default folder icons for now, can be customized later
    case "node_modules":
      return Package;
    case ".git":
      return GitBranch;
    case "docs":
    case "documentation":
      return Book;
    case "database":
    case "db":
      return Database;
    case "config":
      return Settings;
    case "scripts":
      return Terminal;
    case "tests":
    case "__tests__":
      return Shield;
    case "hooks":
      return Key;
    case "ipc":
      return FolderDot;
    case "shared":
      return FolderKanban;
    case "utils":
      return FolderTree;
    default:
      return expanded ? FolderOpen : Folder;
  }
};

// Patterns for temporary files to exclude
const TEMP_FILE_PATTERNS = [
  /~$/, // Files ending with ~
  /^#.*#$/, // Files starting and ending with # (e.g., #file.txt#)
  /^\.#/, // Files starting with .# (e.g., .#file.txt)
  /\.tmp$/, // Files ending with .tmp
  /\.bak$/, // Files ending with .bak
  /\.swp$/, // Swap files (Vim)
  /\.swo$/, // Swap files (Vim)
  /\.DS_Store$/, // macOS directory service store
  /\.next\//, // Next.js build output directory
  /node_modules\//, // Node.js dependencies
  /dist\//, // Common distribution directory
  /build\//, // Common build directory
  /package-lock\.json$/, // package-lock.json
  /yarn\.lock$/, // yarn.lock
  /pnpm-lock\.yaml$/, // pnpm-lock.yaml
  /\bwebpack\b/i, // General pattern for files/dirs containing "webpack"
  /\.next[\\/]static[\\/]webpack[\\/]/, // Specific pattern for Next.js webpack output
];

// Function to check if a file path should be excluded
const isExcluded = (filePath: string): boolean => {
  return TEMP_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
};

// Convert flat file list to tree structure
const buildFileTree = (files: string[]): TreeNode[] => {
  const root: TreeNode[] = [];

  // Normalize paths to use forward slashes before processing
  const normalizedFiles = files.map((file) => file.replace(/\\/g, "/"));

  // Filter out excluded files before building the tree
  const filteredFiles = normalizedFiles.filter((file) => !isExcluded(file));

  filteredFiles.forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");

      // Check if this node already exists at the current level
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        // If we found the node, just drill down to its children for the next level
        currentLevel = existingNode.children;
      } else {
        // Create a new node
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLastPart,
          children: [],
        };

        currentLevel.push(newNode);
        currentLevel = newNode.children;
      }
    });
  });

  return root;
};

// File tree component
export const FileTree = ({ files }: FileTreeProps) => {
  const treeData = buildFileTree(files);

  return (
    <div className="file-tree mt-2">
      <TreeNodes nodes={treeData} level={0} />
    </div>
  );
};

interface TreeNodesProps {
  nodes: TreeNode[];
  level: number;
}

// Sort nodes to show directories first
const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
  return [...nodes].sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });
};

// Tree nodes component
const TreeNodes = ({ nodes, level }: TreeNodesProps) => (
  <ul className="ml-4">
    {sortNodes(nodes).map((node, index) => (
      <TreeNode key={index} node={node} level={level} />
    ))}
  </ul>
);

interface TreeNodeProps {
  node: TreeNode;
  level: number;
}

// Individual tree node component
const TreeNode = ({ node, level }: TreeNodeProps) => {
  const [expanded, setExpanded] = React.useState(false); // Start all directories minimized
  const setSelectedFile = useSetAtom(selectedFileAtom);

  const handleClick = () => {
    if (node.isDirectory) {
      setExpanded(!expanded);
    } else {
      setSelectedFile({
        path: node.path,
      });
    }
  };

  return (
    <li className="py-0.5">
      <div
        className="flex items-center hover:bg-(--sidebar) rounded cursor-pointer px-1.5 py-0.5 text-sm"
        onClick={handleClick}
      >
        <span className="mr-1 text-gray-500">
          {node.isDirectory
            ? React.createElement(getFolderIcon(node.name, expanded), {
                size: 16,
              })
            : React.createElement(getFileIcon(node.name), { size: 16 })}
        </span>
        <span>{node.name}</span>
      </div>

      {node.isDirectory && expanded && node.children.length > 0 && (
        <TreeNodes nodes={node.children} level={level + 1} />
      )}
    </li>
  );
};
