declare global {
  interface Window { upgradePendingPDI?: (rootEl?: Element | Document) => void }
}

export function upgradePendingPDI(rootEl?: Element | Document) {
  const root = (rootEl as Element) || document.querySelector('[role="dialog"]') || document;
  if (!root || (root as HTMLElement).dataset.pdiUpgraded === '1') return;
  (root as HTMLElement).dataset.pdiUpgraded = '1';

  const buildTable = (sectionEl: Element, titleText: string, rows: Array<{ desc: string; pass: HTMLInputElement; fail: HTMLInputElement }>, overhaulBox: HTMLTextAreaElement | null) => {
    const sec = document.createElement('div');
    sec.className = 'pdi-sec';
    const head = document.createElement('div');
    head.className = 'pdi-head';
    head.textContent = titleText || 'Inspection';
    const body = document.createElement('div');
    body.className = 'pdi-body';

    const table = document.createElement('table');
    table.className = 'pdi-prof-table';
    table.innerHTML = '<thead><tr><th>Item</th><th class="c">Pass</th><th class="c">Fail</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody')!;

    rows.forEach(({ desc, pass, fail }) => {
      const tr = document.createElement('tr');
      const tdDesc = document.createElement('td');
      tdDesc.textContent = desc.replace(/\s+/g, ' ').trim();
      tr.appendChild(tdDesc);
      const tdPass = document.createElement('td'); tdPass.className = 'c';
      const tdFail = document.createElement('td'); tdFail.className = 'c';
      const labPass = document.createElement('label'); labPass.title = 'Pass'; labPass.appendChild(pass);
      const labFail = document.createElement('label'); labFail.title = 'Fail'; labFail.appendChild(fail);
      tdPass.appendChild(labPass); tdFail.appendChild(labFail);
      tr.appendChild(tdPass); tr.appendChild(tdFail);
      tbody.appendChild(tr);
    });

    if (overhaulBox) {
      const tf = document.createElement('tfoot');
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td'); tdLabel.textContent = 'Overhaul needed';
      const tdField = document.createElement('td'); tdField.colSpan = 2; tdField.appendChild(overhaulBox);
      tr.appendChild(tdLabel); tr.appendChild(tdField); tf.appendChild(tr); table.appendChild(tf);
    }

    body.appendChild(table); sec.appendChild(head); sec.appendChild(body);
    sectionEl.replaceWith(sec);
  };

  const containers = Array.from(root.querySelectorAll('div, section, table'))
    .filter(el => el.querySelectorAll('input[type="checkbox"]').length >= 6)
    .filter(el => !el.querySelector('table.pdi-prof-table'));

  containers.forEach(container => {
    const lines = Array.from(container.querySelectorAll(':scope > *'))
      .filter((n: Element) => n.querySelectorAll && n.querySelectorAll('input[type="checkbox"]').length === 2);
    if (lines.length < 3) return;

    let titleText = 'Inspection';
    const prev = container.previousElementSibling as HTMLElement | null;
    if (prev && /inspection/i.test(prev.textContent || '')) {
      titleText = (prev.textContent || '').trim();
      if (getComputedStyle(prev).borderTopWidth !== '0px') prev.remove();
    }

    let overhaulBox: HTMLTextAreaElement | null = null;
    const after = container.nextElementSibling as HTMLElement | null;
    if (after && after.tagName === 'TEXTAREA') {
      overhaulBox = after as HTMLTextAreaElement;
      overhaulBox.style.minHeight = '90px';
      overhaulBox.style.width = '100%';
      overhaulBox.style.border = '1px solid #d1d5db';
      overhaulBox.style.borderRadius = '8px';
      after.remove();
    }

    const rows = (lines as HTMLElement[]).map(line => {
      const inputs = Array.from(line.querySelectorAll('input[type="checkbox"])')) as HTMLInputElement[];
      const [pass, fail] = inputs;
      const desc = (line.textContent || '').replace(/\s+/g, ' ').trim();
      line.remove();
      return { desc, pass, fail };
    });

    buildTable(container, titleText, rows, overhaulBox);
  });
}

if (typeof window !== 'undefined') {
  window.upgradePendingPDI = upgradePendingPDI;
}


