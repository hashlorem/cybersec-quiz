(function () {
  window.QZ = window.QZ || {};
  window.QZ.DECKS = window.QZ.DECKS || {};

  window.QZ.DECKS.tf = {
    key: "tf",
    items: [
      {
        id: "t01",
        deck: "network",
        topic: "Attacks",
        type: "tf",
        statement: "A SYN flooding attack exploits the TCP three-way handshake by sending many half-open connection requests with spoofed source addresses.",
        answer: true,
        explanation: "The threat actor continually sends TCP SYN session request packets with a randomly spoofed source IP address, overwhelming the target with half-open connections."
      },
      {
        id: "t02",
        deck: "network",
        topic: "ICMP",
        type: "tf",
        statement: "Threat actors use ICMP mask reply messages to lure a target host into sending traffic through a compromised device.",
        answer: false,
        explanation: "ICMP redirects are the message used for man-in-the-middle luring. Mask reply messages are used to map an internal IP network."
      },
      {
        id: "t03",
        deck: "network",
        topic: "IPv4 and IPv6",
        type: "tf",
        statement: "Because IPv6 routers still perform fragmentation, the identification field is retained in the IPv6 header.",
        answer: false,
        explanation: "Unlike IPv4, IPv6 routers do not perform fragmentation, so the fragment offset, flag, and identification fields have no equivalent in IPv6. IPv6 hosts can fragment using extension headers."
      },
      {
        id: "t04",
        deck: "network",
        topic: "WLAN Security",
        type: "tf",
        statement: "In WLAN passive discovery mode, the client begins the process by broadcasting a probe request.",
        answer: false,
        explanation: "Broadcasting a probe request is active discovery. In passive mode the client listens for the broadcast beacon frames the AP periodically sends."
      },
      {
        id: "t05",
        deck: "network",
        topic: "WLAN Security",
        type: "tf",
        statement: "WPA2 authentication with AES encryption is recommended as a best practice for home wireless networks.",
        answer: true,
        explanation: "WPA2 provides industry-standard authentication and AES provides stronger encryption than TKIP or RC4."
      },
      {
        id: "t06",
        deck: "network",
        topic: "Risk Management",
        type: "tf",
        statement: "Risk avoidance means an organization continues an activity and simply accepts the risk it creates.",
        answer: false,
        explanation: "Risk avoidance means discontinuing the activity that creates the risk. Continuing the activity and accepting the risk is risk retention."
      },
      {
        id: "t07",
        deck: "network",
        topic: "Firewalls and IPS",
        type: "tf",
        statement: "In a zone-based policy firewall configuration, traffic is allowed by default among interfaces that are members of the same zone.",
        answer: true,
        explanation: "Interfaces in the same zone can communicate by default. Traffic is not permitted by default between a zone member interface and an interface that is not a zone member."
      },
      {
        id: "t08",
        deck: "network",
        topic: "Firewalls and IPS",
        type: "tf",
        statement: "An IPS signature is a set of rules used to detect typical intrusive activity.",
        answer: true,
        explanation: "A signature uniquely identifies specific malware, protocol anomalies, or malicious traffic patterns."
      },
      {
        id: "t09",
        deck: "network",
        topic: "VPN",
        type: "tf",
        statement: "A VPN uses virtual connections to create a private network through a public network.",
        answer: true,
        explanation: "A Virtual Private Network uses encrypted virtual connections routed over a public network such as the Internet."
      },
      {
        id: "t10",
        deck: "network",
        topic: "Defense Technologies",
        type: "tf",
        statement: "Encrypting sensitive traffic makes a reconnaissance attack from inside a campus network more likely to succeed.",
        answer: false,
        explanation: "Encryption is the measure that limits reconnaissance: an attacker inside the network can no longer capture readable information from the traffic."
      },
      {
        id: "t11",
        deck: "endpoint",
        topic: "File Systems",
        type: "tf",
        statement: "Compared with FAT32, NTFS supports larger files and provides more security features.",
        answer: true,
        explanation: "Those are the two real advantages. The file system does not control access speed, formatting speed, or configuration difficulty."
      },
      {
        id: "t12",
        deck: "endpoint",
        topic: "Security Concepts",
        type: "tf",
        statement: "Confidentiality is the principle that prevents the disclosure of information to unauthorized people, resources, and processes.",
        answer: true,
        explanation: "Confidentiality is one of the three core security principles alongside integrity and availability."
      },
      {
        id: "t13",
        deck: "endpoint",
        topic: "Malware",
        type: "tf",
        statement: "A rootkit is a set of software tools designed to grant access to portions of the operating system that should not normally be allowed.",
        answer: true,
        explanation: "A rootkit secures a backdoor, grants normally forbidden access, or raises the privileges of a user."
      },
      {
        id: "t14",
        deck: "endpoint",
        topic: "Windows Tools",
        type: "tf",
        statement: "Issued without any options, the netstat command displays the local routing table.",
        answer: false,
        explanation: "Without options, netstat lists all active TCP connections. Other output requires switches such as -r for the routing table."
      },
      {
        id: "t15",
        deck: "endpoint",
        topic: "Linux Tools",
        type: "tf",
        statement: "In the permission string -rwxr--r--, the owner of the file has read, write, and execute rights.",
        answer: true,
        explanation: "Permissions display in user, group, then other order. The first set (rwx) belongs to the file owner."
      },
      {
        id: "t16",
        deck: "endpoint",
        topic: "Linux Tools",
        type: "tf",
        statement: "iptables is a rule-based firewall application in Linux.",
        answer: true,
        explanation: "iptables lets Linux administrators configure network access rules."
      },
      {
        id: "t17",
        deck: "endpoint",
        topic: "Security Policy",
        type: "tf",
        statement: "A comprehensive security policy should stay vague so that staff can apply it flexibly.",
        answer: false,
        explanation: "A comprehensive policy sets rules for expected behavior, defines the legal consequences of violations, and carries the backing of management. Vagueness is a weakness, not a feature."
      },
      {
        id: "t18",
        deck: "endpoint",
        topic: "Patch Management",
        type: "tf",
        statement: "With a centralized patch management solution, users decide when and whether to install the updates.",
        answer: false,
        explanation: "Centralized patch management lets administrators approve or deny patches, force updates on systems immediately, and prevents users from circumventing them."
      },
      {
        id: "t19",
        deck: "endpoint",
        topic: "Endpoint Detection",
        type: "tf",
        statement: "An HIDS monitors network traffic between hosts, while a firewall processes file system activity on the host.",
        answer: false,
        explanation: "It is the reverse. An HIDS monitors the operating system on a host and processes file system activity, while a firewall allows or denies traffic between systems."
      },
      {
        id: "t20",
        deck: "endpoint",
        topic: "Data Protection",
        type: "tf",
        statement: "Data is vulnerable in three states: stored data, data in-transit, and data in-process.",
        answer: true,
        explanation: "A cybersecurity specialist must protect data in all three states. Encrypted or decrypted data can exist in any of them, and purged data was previously stored."
      }
    ]
  };
})();