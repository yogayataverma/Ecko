import React from 'react';
import './FileTree.css';

const FileTree = ({ files = [], onFileSelect }) => {
    const createFileTree = (files) => {
        const root = {};

        if (!files || !Array.isArray(files)) {
            return root;
        }

        files.forEach((file) => {
            const parts = file.path.split(/[/\\]/).filter(Boolean);
            let current = root;

            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    current[part] = { 
                        ...file,
                        type: 'file',
                        name: part
                    };
                } else {
                    current[part] = current[part] || {
                        type: 'directory',
                        name: part,
                        children: {}
                    };
                    current = current[part].children;
                }
            });
        });

        return root;
    };

    const TreeNode = ({ node, name, level = 0 }) => {
        const [isOpen, setIsOpen] = React.useState(true);

        if (node.type === 'file') {
            return (
                <div 
                    className="file-tree-item file-node" 
                    style={{ paddingLeft: `${level * 16}px` }}
                    onClick={() => onFileSelect && onFileSelect(node)}
                >
                    <span className="file-marker">·</span>
                    <span className="file-name">{name}</span>
                </div>
            );
        }

        const hasChildren = node.children && Object.keys(node.children).length > 0;

        return (
            <div>
                <div 
                    className="file-tree-item folder-node"
                    style={{ paddingLeft: `${level * 16}px` }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="folder-arrow">{isOpen ? '▾' : '▸'}</span>
                    <span className="folder-name">{name}</span>
                </div>
                {isOpen && hasChildren && (
                    <div className="file-tree-children">
                        {Object.entries(node.children).map(([childName, childNode]) => (
                            <TreeNode 
                                key={childName}
                                node={childNode}
                                name={childName}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const fileTree = createFileTree(files);

    const renderTree = () => {
        if (!fileTree || Object.keys(fileTree).length === 0) {
            return <div className="empty-tree">No files available</div>;
        }
        return Object.entries(fileTree).map(([name, node]) => (
            <TreeNode key={name} node={node} name={name} />
        ));
    };

    return <div className="file-tree">{renderTree()}</div>;
};

export default FileTree;
