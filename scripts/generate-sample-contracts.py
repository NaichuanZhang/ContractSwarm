"""Generate sample contract PDFs for ContractSwarm demo."""

from fpdf import FPDF
import os

CONTRACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "contracts")
os.makedirs(CONTRACTS_DIR, exist_ok=True)

CONTRACTS = [
    {
        "filename": "acme_corp_msa.pdf",
        "title": "MASTER SERVICES AGREEMENT",
        "client": "Acme Corporation",
        "sections": [
            ("1. DEFINITIONS", '"Confidential Information" means any non-public information disclosed by either party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.'),
            ("2. SERVICES", "Provider shall deliver cybersecurity compliance monitoring services as described in Exhibit A. Provider shall maintain SOC 2 Type II certification throughout the term of this Agreement."),
            ("3. DATA HANDLING", "3.1 Provider shall process Client Data solely for the purpose of providing the Services. Provider shall not transfer, share, or disclose Client Data to any third party without the prior written consent of Client.\n\n3.2 All Client Data shall be stored exclusively within the continental United States. Provider shall not transfer Client Data to any facility, server, or data center located outside the United States without prior written approval from Client."),
            ("4. SUBPROCESSORS", "4.1 Provider shall not engage any subprocessor to process Client Data without obtaining Client's prior written consent. Client shall have the right to object to any proposed subprocessor within thirty (30) days of notification.\n\n4.2 Provider shall maintain a current list of all subprocessors and make it available to Client upon request."),
            ("5. EXCLUSIVITY", "During the term of this Agreement, Client shall not engage any other vendor to provide substantially similar cybersecurity compliance monitoring services. This exclusivity provision shall survive for twelve (12) months following termination."),
            ("6. LIABILITY", "6.1 Provider's total aggregate liability under this Agreement shall not exceed the total fees paid by Client in the twelve (12) months preceding the claim.\n\n6.2 Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages."),
            ("7. TERM AND TERMINATION", "7.1 This Agreement shall have an initial term of three (3) years, automatically renewing for successive one-year periods unless either party provides ninety (90) days' written notice of non-renewal.\n\n7.2 Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days."),
        ],
    },
    {
        "filename": "globex_dpa.pdf",
        "title": "DATA PROCESSING AGREEMENT",
        "client": "Globex Industries",
        "sections": [
            ("1. SCOPE", "This Data Processing Agreement governs the processing of personal data by Provider on behalf of Client in connection with the cybersecurity services described in the Master Services Agreement dated January 15, 2024."),
            ("2. DATA CATEGORIES", "Provider shall process the following categories of personal data: employee names, email addresses, IP addresses, network access logs, device identifiers, and security event data."),
            ("3. PROCESSING RESTRICTIONS", "3.1 Provider shall process personal data only on documented instructions from Client, including with regard to transfers of personal data to a third country.\n\n3.2 Provider shall ensure that persons authorized to process the personal data have committed themselves to confidentiality.\n\n3.3 Provider shall not engage another processor without prior specific written authorization of Client. Where Provider engages another processor, it shall impose the same data protection obligations as set out in this Agreement."),
            ("4. DATA TRANSFERS", "4.1 Provider shall not transfer personal data to any country outside the European Economic Area without appropriate safeguards as required by GDPR Article 46.\n\n4.2 Client acknowledges that Provider's primary data centers are located in the United States and the European Union."),
            ("5. SECURITY MEASURES", "Provider shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:\n(a) pseudonymization and encryption of personal data;\n(b) the ability to ensure ongoing confidentiality and integrity;\n(c) the ability to restore availability and access to personal data in a timely manner;\n(d) a process for regularly testing and evaluating effectiveness of security measures."),
            ("6. BREACH NOTIFICATION", "Provider shall notify Client without undue delay after becoming aware of a personal data breach. Such notification shall include: (a) the nature of the breach; (b) the categories and approximate number of data subjects concerned; (c) the likely consequences of the breach; (d) the measures taken or proposed to address the breach."),
            ("7. AUDIT RIGHTS", "Provider shall make available to Client all information necessary to demonstrate compliance with this Agreement and allow for and contribute to audits conducted by Client or an auditor mandated by Client."),
        ],
    },
    {
        "filename": "initech_services.pdf",
        "title": "SERVICE AGREEMENT",
        "client": "Initech Solutions",
        "sections": [
            ("1. SERVICES DESCRIPTION", "Provider shall provide continuous security monitoring, vulnerability assessment, and compliance reporting services for Client's cloud infrastructure as described in Schedule 1."),
            ("2. CONFIDENTIALITY", "2.1 Each party agrees to maintain the confidentiality of the other party's Confidential Information and not to disclose such information to any third party.\n\n2.2 The receiving party may disclose Confidential Information to its employees, contractors, and agents who need to know such information and who are bound by confidentiality obligations no less restrictive than those contained herein."),
            ("3. INTELLECTUAL PROPERTY", "3.1 All intellectual property rights in the Services and any deliverables shall remain with Provider.\n\n3.2 Client retains all rights to Client Data. Provider is granted a limited, non-exclusive license to use Client Data solely for the purpose of providing the Services."),
            ("4. DATA PROCESSING", "4.1 Provider may engage third-party service providers to assist in delivering the Services, provided that any such third party agrees to substantially similar data protection obligations.\n\n4.2 Provider shall process Client Data in accordance with applicable data protection laws, including but not limited to the California Consumer Privacy Act (CCPA).\n\n4.3 Client Data may be processed in any data center operated by Provider or its approved subprocessors, which currently include facilities in the United States, Canada, and the European Union."),
            ("5. COMPLIANCE", "Provider shall maintain compliance with SOC 2 Type II, ISO 27001, and applicable industry regulations throughout the term of this Agreement."),
            ("6. LIMITATION OF LIABILITY", "PROVIDER'S TOTAL LIABILITY SHALL NOT EXCEED TWO TIMES (2X) THE ANNUAL FEES PAID UNDER THIS AGREEMENT. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR LOST PROFITS, LOSS OF DATA, OR CONSEQUENTIAL DAMAGES."),
            ("7. GOVERNING LAW", "This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws provisions."),
        ],
    },
]


def create_contract_pdf(contract: dict) -> None:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, contract["title"], new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    # Between clause
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Between: {contract['client']} (\"Client\")", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "And: CyberCompliance Inc. (\"Provider\")", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Effective Date: January 1, 2024", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Sections
    for heading, body in contract["sections"]:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 8, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, body)
        pdf.ln(4)

    # Signature block
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "IN WITNESS WHEREOF, the parties have executed this Agreement.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.cell(90, 6, "____________________________", new_x="RIGHT", new_y="LAST")
    pdf.cell(90, 6, "____________________________", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(90, 6, f"{contract['client']}", new_x="RIGHT", new_y="LAST")
    pdf.cell(90, 6, "CyberCompliance Inc.", new_x="LMARGIN", new_y="NEXT")

    filepath = os.path.join(CONTRACTS_DIR, contract["filename"])
    pdf.output(filepath)
    print(f"  Created: {filepath}")


if __name__ == "__main__":
    print("Generating sample contracts...")
    for contract in CONTRACTS:
        create_contract_pdf(contract)
    print(f"Done! {len(CONTRACTS)} contracts created in {CONTRACTS_DIR}")
