
package helios.policies.providers

# Example policy: deny placements that violate basic ToS restrictions

deny[msg] {
  input.type == "placement"
  provider := input.provider
  provider.tos.non_commercial == true
  input.workload.commercial == true
  msg := sprintf("Provider %s forbids commercial workloads on this tier", [provider.name])
}

deny[msg] {
  input.type == "placement"
  provider := input.provider
  provider.tos.no_pooling == true
  input.workload.pooling == true
  msg := sprintf("Provider %s forbids pooling/sharing on this tier", [provider.name])
}
