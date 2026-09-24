#!/usr/bin/env python3
"""Regenerate doc/whitepaper.pdf from doc/whitepaper.md with fpdf2.

Run from the repo root:  python3 doc/make_whitepaper_pdf.py
"""
import os
import re
import sys

from fpdf import FPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPLACEMENTS = {'\u2019': "'", '\u2018': "'", '\u201c': '"', '\u201d': '"',
                '\u2014': '-', '\u2013': '-', '\u2192': '->', '\u2190': '<-',
                '\u2194': '<->', '\u2026': '...', '\u00a0': ' ', '\u2265': '>=',
                '\u2264': '<=', '\u00d7': 'x', '\u2713': 'v'}


class WP(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, 'Shitcoin Whitepaper', align='R')
            self.ln(12)
            self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f'{self.page_no()}/{{nb}}', align='C')


def clean(t):
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'\1', t)
    t = re.sub(r'\*([^*]+)\*', r'\1', t)
    t = re.sub(r'`([^`]+)`', r'\1', t)
    for k, v in REPLACEMENTS.items():
        t = t.replace(k, v)
    return ''.join(c if ord(c) < 256 else '?' for c in t)


def main():
    pdf = WP('P', 'mm', 'A4')
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(True, 20)
    pdf.set_margins(18, 15, 18)
    pdf.add_page()

    lines = open(os.path.join(ROOT, 'doc', 'whitepaper.md')).read().split('\n')
    i = 0
    title_done = False
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue
        if line.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:\-|]+\|$', lines[i + 1]):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                if not re.match(r'^\|[\s:\-|]+\|$', lines[i]):
                    rows.append([clean(c.strip()) for c in lines[i].strip('|').split('|')])
                i += 1
            if rows:
                pdf.set_font('Helvetica', '', 8)
                with pdf.table(width=pdf.w - 36,
                               col_widths=[int(100 / len(rows[0]))] * len(rows[0]),
                               text_align='LEFT', line_height=6) as table:
                    for row in rows:
                        tr = table.row()
                        for cell in row:
                            tr.cell(cell)
                pdf.ln(4)
            continue
        if line.startswith('# '):
            pdf.set_font('Helvetica', 'B', 20)
            pdf.multi_cell(0, 10, clean(line[2:]))
            if not title_done:
                logo = os.path.join(ROOT, 'assets', 'shitcoin-logo.png')
                if os.path.exists(logo):
                    pdf.ln(4)
                    pdf.image(logo, x=(pdf.w - 55) / 2, w=55)
                    pdf.ln(6)
                title_done = True
            else:
                pdf.ln(4)
        elif line.startswith('## '):
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 14)
            pdf.multi_cell(0, 8, clean(line[3:]))
            pdf.ln(2)
        elif line.startswith('### '):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 11)
            pdf.multi_cell(0, 7, clean(line[4:]))
            pdf.ln(1)
        elif line.startswith('- ') or line.startswith('* '):
            pdf.set_font('Helvetica', '', 10)
            x = pdf.get_x()
            pdf.set_x(x + 6)
            pdf.multi_cell(0, 6, clean(line[2:]))
            pdf.ln(1)
        elif re.match(r'^\d+\. ', line):
            pdf.set_font('Helvetica', '', 10)
            pdf.multi_cell(0, 6, clean(line))
            pdf.ln(1)
        else:
            pdf.set_font('Helvetica', '', 10)
            pdf.multi_cell(0, 6, clean(line))
            pdf.ln(2)
        i += 1

    out = os.path.join(ROOT, 'doc', 'whitepaper.pdf')
    pdf.output(out)
    print(f"wrote {out}")


if __name__ == '__main__':
    sys.exit(main())
