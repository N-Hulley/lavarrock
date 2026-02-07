import React, { createContext, useContext } from "react";

interface EditorContextType {
  currentFile: string | null;
  setCurrentFile: (file: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentFile, setCurrentFile] = React.useState<string | null>(null);

  return (
    <EditorContext.Provider value={{ currentFile, setCurrentFile }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
};
