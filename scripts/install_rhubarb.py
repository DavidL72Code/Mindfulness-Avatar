import os
import stat
import urllib.request
import zipfile


RHUBARB_VERSION = "1.14.0"
RHUBARB_URL = (
    "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/"
    f"v{RHUBARB_VERSION}/Rhubarb-Lip-Sync-{RHUBARB_VERSION}-Linux.zip"
)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR_DIR = os.path.join(ROOT_DIR, "vendor", "rhubarb")
BIN_PATH = os.path.join(VENDOR_DIR, "rhubarb")
ZIP_PATH = os.path.join(VENDOR_DIR, "rhubarb.zip")


def main():
    if os.path.exists(BIN_PATH):
        print(f"Rhubarb already installed at {BIN_PATH}")
        return

    os.makedirs(VENDOR_DIR, exist_ok=True)
    print(f"Downloading Rhubarb Lip Sync {RHUBARB_VERSION}...")
    urllib.request.urlretrieve(RHUBARB_URL, ZIP_PATH)

    with zipfile.ZipFile(ZIP_PATH) as archive:
        archive.extractall(VENDOR_DIR)
    os.remove(ZIP_PATH)

    if not os.path.exists(BIN_PATH):
        raise RuntimeError(f"Expected Rhubarb binary at {BIN_PATH}")

    mode = os.stat(BIN_PATH).st_mode
    os.chmod(BIN_PATH, mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    print(f"Installed Rhubarb at {BIN_PATH}")


if __name__ == "__main__":
    main()
