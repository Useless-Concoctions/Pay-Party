
import { differenceInDays, parseISO } from 'date-fns';

export function detectEras(paycheques) {
    // Sort by date ascending for processing
    const sorted = [...paycheques].sort((a, b) => new Date(a.date) - new Date(b.date));

    const eras = [];
    let currentEra = null;

    sorted.forEach((p, index) => {
        if (!currentEra || p.company !== currentEra.company) {
            // New Era or Job Switch
            if (currentEra) {
                currentEra.endDate = sorted[index - 1].date;
                eras.push(currentEra);
            }
            currentEra = {
                company: p.company,
                role: p.role,
                startDate: p.date,
                startPay: p.gross,
                endPay: p.gross,
                startNet: p.net || 0,
                endNet: p.net || 0,
                paycheques: []
            };
        }

        currentEra.paycheques.push(p);
        currentEra.endPay = p.gross;
        currentEra.endNet = p.net || 0;

        // Last item check
        if (index === sorted.length - 1) {
            currentEra.endDate = p.date;
            eras.push(currentEra);
        }
    });

    // Calculate tenure and growth
    eras.forEach(era => {
        era.tenureDays = differenceInDays(parseISO(era.endDate), parseISO(era.startDate));
        era.growth = ((era.endPay - era.startPay) / era.startPay) * 100;
    });

    return eras;
}

export function calculateYoY(paycheques) {
    // Basic Period YoY Logic: Group by "Period Index" (1-26 approx)
    // This assumes bi-weekly. For now, we'll map dates to a 1-52 week index or 1-24 semi-monthly index.
    // Let's assume standard bi-weekly: ~26 periods.

    // Improved approach: Map to Month-Index (0-23 for semi-monthly, or just Month 0-11).
    // The requirement says "Period 1-26".
    // We will bucket by "Week of Year / 2" roughly.

    // For specific Pay Period YoY, we need to find "The paycheque happened X days ago year".
    // Let's return a map: "Year -> { Period -> Data }"

    const years = {};

    paycheques.forEach(p => {
        const date = parseISO(p.date);
        const year = date.getFullYear();
        // Period estimation: DayOfYear / 14. 
        // Simple approximation: Week number / 2.
        // Or just ordered index within the year?
        // Let's use ordered index for now, assuming strictly 1 cheque per period.
        // If there are multiple, we might need robust logic.

        if (!years[year]) years[year] = [];
        years[year].push(p);
    });

    // Sort each year
    Object.keys(years).forEach(y => {
        years[y].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return years;
}
