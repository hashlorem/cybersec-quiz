(function () {
  window.QZ = window.QZ || {};
  window.QZ.DECKS = window.QZ.DECKS || {};

  window.QZ.DECKS.endpoint = {
    key: "endpoint",
    title: "OS and Endpoint Security Checkpoint",
    kicker: "Modules 7-10",
    blurb: "File systems, AAA, patch management, Linux and Windows tools, malware defense.",
    items: [
      {
        id: "e01",
        topic: "File Systems",
        type: "multi",
        choose: 2,
        prompt: "What are two advantages of the NTFS file system compared with FAT32? (Choose two.)",
        options: [
          "NTFS allows faster access to external peripherals such as a USB drive.",
          "NTFS supports larger files.",
          "NTFS provides more security features.",
          "NTFS allows faster formatting of drives.",
          "NTFS is easier to configure.",
          "NTFS allows the automatic detection of bad sectors."
        ],
        correct: [1, 2],
        explanation: "The file system has no control over the speed of access or formatting of drives, and the ease of configuration is not file system-dependent."
      },
      {
        id: "e02",
        topic: "Access Control",
        type: "multi",
        choose: 3,
        prompt: "What are three access control security services? (Choose three.)",
        options: ["availability", "authentication", "authorization", "repudiation", "accounting", "access"],
        correct: [1, 2, 4],
        explanation: "This question refers to AAA: authentication, authorization, and accounting."
      },
      {
        id: "e03",
        topic: "Security Concepts",
        type: "mc",
        prompt: "What principle prevents the disclosure of information to unauthorized people, resources, and processes?",
        options: ["confidentiality", "integrity", "availability", "nonrepudiation", "accounting"],
        correct: [0],
        explanation: "The security principle of confidentiality refers to the prevention of the disclosure of information to unauthorized people, resources, and processes."
      },
      {
        id: "e04",
        topic: "Patch Management",
        type: "multi",
        choose: 3,
        prompt: "A user is proposing the purchase of a patch management solution for a company. The user wants to give reasons why the company should spend money on a solution. What benefits does patch management provide? (Choose three.)",
        options: [
          "Administrators can approve or deny patches.",
          "Patches can be written quickly.",
          "Updates can be forced on systems immediately.",
          "Patches can be chosen by the user.",
          "Computers require a connection to the Internet to receive patches.",
          "Updates cannot be circumvented."
        ],
        correct: [0, 2, 5],
        explanation: "A centralized patch management system can speed up deployment of patches and automate the process. Other good reasons for using an automated patch update service include: administrators control the update process, reports are generated, and updates are provided from a local server."
      },
      {
        id: "e05",
        topic: "Security Policy",
        type: "multi",
        choose: 3,
        prompt: "What three tasks are accomplished by a comprehensive security policy? (Choose three.)",
        options: [
          "sets rules for expected behavior",
          "defines legal consequences of violations",
          "gives security staff the backing of management",
          "vagueness",
          "useful for management",
          "is not legally binding"
        ],
        correct: [0, 1, 2],
        explanation: "Policy sets the establishment of rules and guidelines for the business. A good policy is specific, defines the consequences of violation, and carries management authority."
      },
      {
        id: "e06",
        topic: "Windows Tools",
        type: "mc",
        prompt: "What would be a reason for a computer user to use the Task Manager Performance tab?",
        options: [
          "to increase the performance of the CPU",
          "to view the processes that are running and end a process if needed",
          "to view the services that are currently running on the PC",
          "to check the CPU usage of the PC"
        ],
        correct: [3],
        explanation: "The Performance tab is commonly used to check current computer performance. Two key areas that are shown are memory and CPU usage."
      },
      {
        id: "e07",
        topic: "Data Protection",
        type: "multi",
        choose: 3,
        prompt: "What are three states of data during which data is vulnerable? (Choose three.)",
        options: ["stored data", "purged data", "data in-transit", "data encrypted", "data decrypted", "data in-process"],
        correct: [0, 2, 5],
        explanation: "A cybersecurity specialist must be aware of each of the three states of data to effectively protect data and information. Purged data was stored data. Encrypted and decrypted data can be in any of the three states."
      },
      {
        id: "e08",
        topic: "Operating Systems",
        type: "mc",
        prompt: "What is the function of the kernel of an operating system?",
        options: [
          "It provides a user interface that allows users to request a specific task.",
          "The kernel links the hardware drivers with the underlying electronics of a computer.",
          "It is an application that allows the initial configuration of a Cisco device.",
          "The kernel provisions hardware resources to meet software requirements."
        ],
        correct: [3],
        explanation: "Operating systems function with a shell, a kernel, and the hardware. The shell interfaces with the users, allowing them to request specific tasks from the device. The kernel provisions resources from the hardware to meet software requirements. The hardware functions by using drivers and their underlying electronics."
      },
      {
        id: "e09",
        topic: "Linux Tools",
        type: "multi",
        choose: 2,
        prompt: "Which two options are window managers for Linux? (Choose two.)",
        options: ["File Explorer", "Gnome", "Kali", "KDE", "PenTesting"],
        correct: [1, 3],
        explanation: "The X Window System provides the basic framework for a GUI, but the GUI itself varies greatly between different distributions. Two window managers are Gnome and KDE."
      },
      {
        id: "e10",
        topic: "Malware",
        type: "mc",
        prompt: "What term describes a set of software tools designed to increase the privileges of a user or to grant access to the user to portions of the operating system that should not normally be allowed?",
        options: ["compiler", "package manager", "penetration testing", "rootkit"],
        correct: [3],
        explanation: "A rootkit is used by an attacker to secure a backdoor to a compromised computer, grant access to portions of the operating system normally not permitted, or increase the privileges of a user."
      },
      {
        id: "e11",
        topic: "Endpoint Detection",
        type: "mc",
        prompt: "What is the difference between an HIDS and a firewall?",
        options: [
          "An HIDS blocks intrusions, whereas a firewall filters them.",
          "A firewall allows and denies traffic based on rules and an HIDS monitors network traffic.",
          "An HIDS monitors operating systems on host computers and processes file system activity. Firewalls allow or deny traffic between the computer and other systems.",
          "A firewall performs packet filtering and therefore is limited in effectiveness, whereas an HIDS blocks intrusions.",
          "An HIDS works like an IPS, whereas a firewall just monitors traffic."
        ],
        correct: [2],
        explanation: "In order to monitor local activity an HIDS should be implemented. Network activity monitors are concerned with traffic and not operating system activity."
      },
      {
        id: "e12",
        topic: "Windows Tools",
        type: "mc",
        prompt: "A PC user issues the netstat command without any options. What is displayed as the result of this command?",
        options: [
          "a local routing table",
          "a network connection and usage report",
          "a list of all established active TCP connections",
          "a historical list of successful pings that have been sent"
        ],
        correct: [2],
        explanation: "When used by itself (without any options), the netstat command will display all the active TCP connections that are available."
      },
      {
        id: "e13",
        topic: "Linux Tools",
        type: "mc",
        prompt: "Consider the result of the ls -l command in the Linux output below. What are the file permissions assigned to the sales user for the analyst.txt file?",
        code: "ls -l analyst.txt\n-rwxr--r-- sales staff 1028 May 28 15:50 analyst.txt",
        options: ["read, write, execute", "read only", "read, write", "write only"],
        correct: [0],
        explanation: "The file permissions are always displayed in the User, Group, and Other order. The dash (-) means that this is a file. The first set of characters (rwx) represents user permissions, so the user sales, who owns the file, can read, write, and execute it. The second set (r--) gives the staff group read-only access, and the third set (r--) gives other users read-only access."
      },
      {
        id: "e14",
        topic: "Linux Tools",
        type: "mc",
        prompt: "Which statement describes the term iptables?",
        options: [
          "It is a DNS daemon in Linux.",
          "It is a DHCP application in Windows.",
          "It is a rule-based firewall application in Linux.",
          "It is a file used by a DHCP server to store current active IP addresses."
        ],
        correct: [2],
        explanation: "Iptables is an application that allows Linux system administrators to configure network access rules."
      },
      {
        id: "e15",
        topic: "Endpoint Detection",
        type: "match",
        prompt: "Match the network-based anti-malware solution to the function.",
        pairs: [
          { left: "Provides filtering of SPAM and potentially malicious emails before they reach the endpoint", right: "Email security appliance" },
          { left: "Provides filtering of websites and blacklisting before they reach the endpoint", right: "Web security appliance" },
          { left: "Permits only authorized and compliant systems to connect to the network", right: "Network admission control" },
          { left: "Provides endpoint protection from viruses and malware", right: "Advanced malware protection" }
        ],
        explanation: "Each appliance sits at a different point of the attack surface: email security filters mail, web security filters and blacklists sites, network admission control enforces compliance before access, and advanced malware protection defends the endpoint itself."
      },
      {
        id: "e16",
        topic: "Endpoint Detection",
        type: "mc",
        prompt: "Which statement describes the policy-based intrusion detection approach?",
        options: [
          "It compares the operations of a host against well-defined security rules.",
          "It compares the signatures of incoming traffic to a known intrusion database.",
          "It compares the antimalware definitions to a central repository for the latest updates.",
          "It compares the behaviors of a host to an established baseline to identify potential intrusion."
        ],
        correct: [0],
        explanation: "With the policy-based (or anomaly-based) intrusion detection approach, a set of rules or policies are applied to a host. Violation of these policies is interpreted to be the result of a potential intrusion."
      },
      {
        id: "e17",
        topic: "Linux Tools",
        type: "match",
        prompt: "Match the Linux command to the function.",
        pairs: [
          { left: "Displays the name of the current working directory", right: "pwd" },
          { left: "Runs a command as another user", right: "sudo" },
          { left: "Modifies file permissions", right: "chmod" },
          { left: "Lists the processes that are currently running", right: "ps" }
        ],
        explanation: "pwd prints the working directory, sudo runs a command as another user, chmod changes file permissions, and ps lists running processes."
      },
      {
        id: "e18",
        topic: "Windows Tools",
        type: "match",
        prompt: "Match the Windows command to the description.",
        pairs: [
          { left: "Renames a file", right: "ren" },
          { left: "Creates a new directory", right: "mkdir" },
          { left: "Changes the current directory", right: "cd" },
          { left: "Lists files in a directory", right: "dir" }
        ],
        explanation: "ren renames a file, mkdir creates a directory, cd changes the current directory, and dir lists the files in a directory."
      },
      {
        id: "e19",
        topic: "Security Concepts",
        type: "multi",
        choose: 3,
        prompt: "What three methods help to ensure system availability? (Choose three.)",
        options: [
          "system backups",
          "equipment maintenance",
          "system resiliency",
          "integrity checking",
          "up-to-date operating systems",
          "fire extinguishers"
        ],
        correct: [0, 1, 4],
        explanation: "Equipment maintenance, system backups, and up-to-date operating systems all help ensure system availability."
      },
      {
        id: "e20",
        topic: "Malware",
        type: "mc",
        prompt: "Which statement describes the Cisco Threat Grid Glovebox?",
        options: [
          "It is a firewall appliance.",
          "It is a network-based IDS/IPS.",
          "It is a sandbox product for analyzing malware behaviors.",
          "It is a host-based intrusion detection system (HIDS) solution to fight against malware."
        ],
        correct: [2],
        explanation: "Cisco ThreatGrid Glovebox is a sandbox product for analyzing malware behaviors."
      },
      {
        id: "e21",
        topic: "Windows Tools",
        type: "match",
        prompt: "Match the Windows system tool with the description.",
        pairs: [
          { left: "A hierarchical database of all system and user information", right: "Registry" },
          { left: "Selectively denies traffic on specified interfaces", right: "Windows Firewall" },
          { left: "A CLI environment used to run scripts and automate tasks", right: "PowerShell" },
          { left: "Maintains system logs", right: "Event Viewer" }
        ],
        explanation: "The Registry stores system and user configuration, Windows Firewall filters traffic per interface, PowerShell automates tasks from the command line, and Event Viewer holds the system logs."
      },
      {
        id: "e22",
        topic: "Linux Tools",
        type: "mc",
        prompt: "Why is Kali Linux a popular choice in testing the network security of an organization?",
        options: [
          "It is an open source Linux security distribution containing many penetration tools.",
          "It can be used to intercept and log network traffic.",
          "It can be used to test weaknesses by using only malicious software.",
          "It is a network scanning tool that prioritizes security risks."
        ],
        correct: [0],
        explanation: "Kali is an open-source Linux security distribution that is commonly used by IT professionals to test the security of networks."
      },
      {
        id: "e23",
        topic: "Network Protocols",
        type: "mc",
        prompt: "A client device has initiated a secure HTTP request to a web browser. Which well-known port address number is associated with the destination address?",
        options: ["404", "80", "443", "110"],
        correct: [2],
        explanation: "Port numbers are used in TCP and UDP communications to differentiate between the various services running on a device. The well-known port number used by HTTPS is port 443."
      },
      {
        id: "e24",
        topic: "Malware",
        type: "match",
        prompt: "Match the antimalware approach to the description.",
        pairs: [
          { left: "Recognizes characteristics of known malware files", right: "Signature-based" },
          { left: "Recognizes general features shared by types of malware", right: "Heuristics-based" },
          { left: "Recognizes malware through analysis of suspicious actions", right: "Behavior-based" }
        ],
        explanation: "Signature-based detection matches known malware characteristics, heuristics-based detection matches general features shared by malware families, and behavior-based detection watches for suspicious actions."
      }
    ]
  };
})();