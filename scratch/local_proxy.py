import socket
import select
import threading
import sys

GITHUB_IP = "20.207.73.82"

def handle_client(client_socket):
    try:
        request = b""
        while b"\r\n\r\n" not in request:
            chunk = client_socket.recv(4096)
            if not chunk:
                break
            request += chunk

        if not request:
            client_socket.close()
            return

        first_line = request.split(b"\r\n")[0].decode("utf-8", errors="ignore")
        parts = first_line.split(" ")
        if len(parts) < 2:
            client_socket.close()
            return

        method, target = parts[0], parts[1]

        if method == "CONNECT":
            host, port_str = target.split(":")
            port = int(port_str)
            target_ip = GITHUB_IP if "github.com" in host else host

            remote_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            remote_socket.connect((target_ip, port))

            client_socket.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")

            sockets = [client_socket, remote_socket]
            while True:
                readable, _, _ = select.select(sockets, [], [], 60)
                if not readable:
                    break
                for s in readable:
                    other = remote_socket if s is client_socket else client_socket
                    data = s.recv(32768)
                    if not data:
                        return
                    other.sendall(data)
        else:
            client_socket.close()
    except Exception as e:
        pass
    finally:
        try:
            client_socket.close()
        except:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", 18888))
    server.listen(10)
    print("Proxy listening on 127.0.0.1:18888", flush=True)

    while True:
        client, addr = server.accept()
        t = threading.Thread(target=handle_client, args=(client,), daemon=True)
        t.start()

if __name__ == "__main__":
    main()
