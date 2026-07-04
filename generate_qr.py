import qrcode

url = "https://github.com/Orsted10/GestureAI/releases/download/1.0.0/GestureAI.apk"

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save(r"C:\Users\ankan\.gemini\antigravity-ide\brain\e651f334-9247-44ea-bdba-41b296e3eb51\gestureai_qr_v1.png")
print("QR Code generated successfully.")
