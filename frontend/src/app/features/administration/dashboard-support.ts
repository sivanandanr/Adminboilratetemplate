import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../../shared/icon';
import { ActivitySummary, ServiceSummary } from './dashboard.models';

@Component({
  selector: 'iam-dashboard-support',
  imports: [Icon],
  template: `
    <div class="supporting-panels">
      <section class="panel activity-panel" aria-labelledby="activity-title"><div class="support-title"><h2 id="activity-title">Recent Administrative Activity</h2><span class="sample-label">Mock</span></div><ul>
        @for (item of activity(); track item.id) { <li><span class="activity-icon"><iam-icon [name]="item.icon" [size]="21" /></span><div><strong>{{ item.text }}</strong><p>{{ item.detail }}</p></div><span class="badge badge-success">Success</span></li> }
      </ul></section>
      <section class="panel health-panel" aria-labelledby="health-title"><div class="support-title"><iam-icon name="Activity" /><h2 id="health-title">System Health &amp; Configuration</h2></div><p class="sample-label">Simulated status — no live services connected</p><div class="health-content"><ul>
        @for (service of services(); track service.name) { <li><iam-icon name="CircleCheck" [size]="15" /><span>{{ service.name }}</span><span class="badge badge-success">{{ service.status }}</span></li> }
      </ul><div class="uptime" role="img" aria-label="Mock system uptime, 99.9 percent"><div class="gauge"><strong>99.9%</strong></div><p>Sample Uptime<br />(Last 30 Days)</p></div></div></section>
    </div>
  `,
  styleUrl: './dashboard-support.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSupport {
  readonly activity = input.required<readonly ActivitySummary[]>();
  readonly services = input.required<readonly ServiceSummary[]>();
}
