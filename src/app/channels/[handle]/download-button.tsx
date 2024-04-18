"use client";

type Props = {
  label?: string;
  content: string;
  filename: string;
  type: string;
  className?: string;
};

export default function DownloadButton({
  label = "Download",
  content,
  filename,
  type,
  className = "",
}: Props) {
  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <button onClick={downloadFile} className={className}>
      {label}
    </button>
  );
}
