import { formatCents, plural } from "../../lib/format";
import styles from "./PriceBreakdown.module.css";

type Breakdown = {
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
};

export function PriceBreakdown({ price }: { price: Breakdown }) {
  return (
    <dl className={styles.breakdown}>
      <div>
        <dt>
          {formatCents(price.nightlyRate)} × {plural(price.nights, "night")}
        </dt>
        <dd>{formatCents(price.subtotal)}</dd>
      </div>
      <div>
        <dt>Cleaning fee</dt>
        <dd>{formatCents(price.cleaningFee)}</dd>
      </div>
      <div>
        <dt>Service fee</dt>
        <dd>{formatCents(price.serviceFee)}</dd>
      </div>
      <div className={styles.total}>
        <dt>Total</dt>
        <dd>{formatCents(price.total)}</dd>
      </div>
    </dl>
  );
}
