import qrcode
from io import BytesIO
import base64


def generate_qr_code(url: str) -> str:
    """
    Generates a QR code from a URL and returns it as a base64 encoded data URI.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffered = BytesIO()
    img.save(buffered, format="PNG")

    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    data_uri = f"data:image/png;base64,{img_str}"

    return data_uri
