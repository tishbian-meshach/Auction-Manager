import jsPDF from 'jspdf';

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve) => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(',')[1]);
        };
        reader.readAsDataURL(blob);
    });
}

export async function setupPdfFont(doc: jsPDF): Promise<void> {
    try {
        const response = await fetch('/NotoSansTamil.ttf');
        if (!response.ok) {
            console.error('Failed to fetch Tamil font');
            return;
        }
        const buffer = await response.arrayBuffer();
        const base64Str = await arrayBufferToBase64(buffer);

        doc.addFileToVFS('NotoSansTamil.ttf', base64Str);
        doc.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'normal');
        doc.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'bold');
        
        doc.setFont('NotoSansTamil');
    } catch (err) {
        console.error('Error configuring PDF font:', err);
    }
}
